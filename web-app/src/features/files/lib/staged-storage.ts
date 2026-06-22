import { randomUUID } from "node:crypto";
import type { MoveObjectResult, StagedFile, StagedFileStatus } from "@/features/files/lib/types";

type StorageRow = {
  id: string | null;
  name: string | null;
  metadata?: unknown;
};

type StorageResponse<T> = {
  data: T | null;
  error: { message?: string; error?: string } | null;
};

type CreateClient = () => Promise<{
  storage: {
    from: (bucket: string) => {
      createSignedUrl: (path: string, expiresIn: number) => Promise<StorageResponse<{ signedUrl?: string }>>;
      list: (
        prefix: string,
        options: { limit: number; sortBy: { column: string; order: "asc" | "desc" } },
      ) => Promise<StorageResponse<StorageRow[]>>;
      upload: (
        path: string,
        data: Uint8Array,
        options: { contentType: string; upsert: boolean },
      ) => Promise<StorageResponse<unknown>>;
      remove: (paths: string[]) => Promise<StorageResponse<unknown>>;
      move: (fromPath: string, toPath: string) => Promise<StorageResponse<unknown>>;
      copy: (fromPath: string, toPath: string) => Promise<StorageResponse<unknown>>;
    };
  };
}>;

function sanitizeFileName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_");
}

export function buildStoredFileName(originalFileName: string) {
  return `${randomUUID()}__${sanitizeFileName(originalFileName)}`;
}

export function originalNameFromStoredFileName(storedName: string) {
  const splitToken = "__";
  const tokenIndex = storedName.indexOf(splitToken);
  if (tokenIndex === -1) return storedName;
  return storedName.slice(tokenIndex + splitToken.length);
}

export function isStorageObjectNotFoundError(error: unknown) {
  if (!error || typeof error !== "object") return false;
  const maybe = error as { message?: string; error?: string };
  const message = `${maybe.message ?? ""} ${maybe.error ?? ""}`.toLowerCase();
  return message.includes("object not found");
}

export function createStagedStorageService(input: {
  createClient: CreateClient;
  bucketName: string;
}) {
  const createSignedUrlForPath = async (objectPath: string) => {
    const supabase = await input.createClient();
    const { data } = await supabase.storage
      .from(input.bucketName)
      .createSignedUrl(objectPath, 60 * 60);

    return data?.signedUrl ?? null;
  };

  return {
    createSignedUrlForPath,

    async listFilesUnderPrefix<TClassification extends string>(params: {
      prefix: string;
      classification: TClassification;
      status: StagedFileStatus;
    }): Promise<StagedFile<TClassification>[]> {
      const supabase = await input.createClient();
      const { data, error } = await supabase.storage.from(input.bucketName).list(params.prefix, {
        limit: 200,
        sortBy: { column: "name", order: "desc" },
      });

      if (error) throw new Error(error.message ?? "Failed to list files.");

      const rows = (data ?? []).filter(
        (row: StorageRow) => row.name && !row.id?.endsWith("/"),
      );

      return await Promise.all(
        rows.map(async (row) => {
          const objectPath = `${params.prefix}/${row.name}`;
          const previewUrl = await createSignedUrlForPath(objectPath);
          const metadata = (row.metadata ?? {}) as {
            size?: number;
            mimetype?: string;
          };

          return {
            id: objectPath,
            objectPath,
            fileName: originalNameFromStoredFileName(row.name ?? ""),
            fileSize: metadata.size ?? 0,
            mimeType: metadata.mimetype ?? null,
            previewUrl,
            classification: params.classification,
            status: params.status,
          };
        }),
      );
    },

    async stageFilesToPrefix<TClassification extends string>(params: {
      prefix: string;
      files: File[];
      classification: TClassification;
    }): Promise<StagedFile<TClassification>[]> {
      const supabase = await input.createClient();
      const stagedItems: StagedFile<TClassification>[] = [];

      for (const file of params.files) {
        const storedFileName = buildStoredFileName(file.name);
        const objectPath = `${params.prefix}/${storedFileName}`;
        const bytes = new Uint8Array(await file.arrayBuffer());

        const { error: uploadError } = await supabase.storage
          .from(input.bucketName)
          .upload(objectPath, bytes, {
            contentType: file.type || "application/octet-stream",
            upsert: false,
          });

        if (uploadError) throw new Error(uploadError.message ?? "Failed to stage file.");

        stagedItems.push({
          id: objectPath,
          objectPath,
          fileName: file.name,
          fileSize: file.size,
          mimeType: file.type || null,
          previewUrl: await createSignedUrlForPath(objectPath),
          classification: params.classification,
          status: "UNCOMMITTED",
        });
      }

      return stagedItems;
    },

    async removeObject(objectPath: string) {
      const supabase = await input.createClient();
      const { error } = await supabase.storage.from(input.bucketName).remove([objectPath]);
      if (error && !isStorageObjectNotFoundError(error)) {
        throw new Error(error.message ?? "Failed to remove object.");
      }
    },

    async removeObjects(objectPaths: string[]) {
      if (objectPaths.length === 0) return;
      const supabase = await input.createClient();
      const { error } = await supabase.storage.from(input.bucketName).remove(objectPaths);
      if (error) throw new Error(error.message ?? "Failed to remove objects.");
    },

    async moveObject(fromPath: string, toPath: string): Promise<MoveObjectResult> {
      const supabase = await input.createClient();
      const { error } = await supabase.storage
        .from(input.bucketName)
        .move(fromPath, toPath);
      if (error) {
        if (isStorageObjectNotFoundError(error)) return "missing";
        throw new Error(error.message ?? "Failed to move object.");
      }
      return "moved";
    },

    async copyObject(fromPath: string, toPath: string): Promise<MoveObjectResult> {
      const supabase = await input.createClient();
      const { error } = await supabase.storage
        .from(input.bucketName)
        .copy(fromPath, toPath);
      if (error) {
        if (isStorageObjectNotFoundError(error)) return "missing";
        throw new Error(error.message ?? "Failed to copy object.");
      }
      return "moved";
    },
  };
}
