export type StagedFileStatus = "UNCOMMITTED" | "COMMITTED";

export type StagedFile<TClassification extends string = string> = {
  id: string;
  objectPath: string;
  fileName: string;
  fileSize: number;
  mimeType: string | null;
  previewUrl: string | null;
  classification: TClassification;
  status: StagedFileStatus;
};

export type StagedFileBucket<TClassification extends string = string> = {
  uncommitted: StagedFile<TClassification>[];
  committed: StagedFile<TClassification>[];
};

export type StagedFileSnapshot<
  TSection extends string = string,
  TClassification extends string = string,
> = Record<TSection, StagedFileBucket<TClassification>>;

export type MoveObjectResult = "moved" | "missing";
