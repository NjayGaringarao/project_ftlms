import { originalNameFromStoredFileName } from "@/features/files/lib/staged-storage";
import type {
  MoveObjectResult,
  StagedFile,
  StagedFileSnapshot,
} from "@/features/files/lib/types";

type CommitStagedFilesParams<TSection extends string, TClassification extends string> = {
  beforeSnapshot: StagedFileSnapshot<TSection, TClassification>;
  uncommittedObjectPaths: string[];
  removedCommittedPaths: string[];
  sourcePrefix: string;
  targetPrefix: string;
  resolveSectionForClassification: (classification: TClassification) => TSection;
  resolveClassificationFromCommittedPath: (objectPath: string) => TClassification | null;
  createPreviewUrl: (objectPath: string) => Promise<string | null>;
  moveObject: (fromPath: string, toPath: string) => Promise<MoveObjectResult>;
  removeObjects: (objectPaths: string[]) => Promise<void>;
};

export async function commitStagedFilesToCommittedSnapshot<
  TSection extends string,
  TClassification extends string,
>(
  input: CommitStagedFilesParams<TSection, TClassification>,
): Promise<StagedFileSnapshot<TSection, TClassification>> {
  const sectionKeys = Object.keys(input.beforeSnapshot) as TSection[];
  const uncommittedByPath = new Map<string, StagedFile<TClassification>>();

  for (const section of sectionKeys) {
    for (const file of input.beforeSnapshot[section].uncommitted) {
      uncommittedByPath.set(file.objectPath, file);
    }
  }

  const sanitizedUncommittedPaths = Array.from(
    new Set(input.uncommittedObjectPaths),
  ).filter((path) => path.startsWith(input.sourcePrefix));

  const pathsToCommit =
    sanitizedUncommittedPaths.length > 0
      ? sanitizedUncommittedPaths
      : Array.from(uncommittedByPath.keys());

  const removable = input.removedCommittedPaths.filter((path) =>
    path.startsWith(input.targetPrefix),
  );
  if (removable.length > 0) {
    await input.removeObjects(removable);
  }
  const removedPathSet = new Set(removable);

  const nextSnapshot = {} as StagedFileSnapshot<TSection, TClassification>;
  for (const section of sectionKeys) {
    nextSnapshot[section] = {
      uncommitted: [],
      committed: input.beforeSnapshot[section].committed.filter(
        (file) => !removedPathSet.has(file.objectPath),
      ),
    };
  }

  for (const fromPath of pathsToCommit) {
    const known = uncommittedByPath.get(fromPath);
    const toPath = fromPath.replace(input.sourcePrefix, input.targetPrefix);
    const moveStatus = await input.moveObject(fromPath, toPath);
    if (moveStatus === "missing") continue;

    const classification =
      known?.classification ?? input.resolveClassificationFromCommittedPath(toPath);
    if (!classification) continue;

    const section = input.resolveSectionForClassification(classification);
    nextSnapshot[section].committed.push({
      id: toPath,
      objectPath: toPath,
      fileName:
        known?.fileName ??
        originalNameFromStoredFileName(toPath.split("/").pop() ?? "file"),
      fileSize: known?.fileSize ?? 0,
      mimeType: known?.mimeType ?? null,
      previewUrl: await input.createPreviewUrl(toPath),
      classification,
      status: "COMMITTED",
    });
  }

  return nextSnapshot;
}
