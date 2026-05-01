"use server";

import { createClient } from "@/utils/supabase/server";
import {
  mapDuplicateError,
  normalizeCode,
  normalizeDescription,
  normalizeName,
  revalidateBlocksPaths,
  revalidateCampusProgramMajorOfferingsPaths,
  revalidateCampusProgramOfferingDetailPath,
  revalidateDepartmentProgramDetailPath,
  revalidateDepartmentProgramsPaths,
  revalidateMajorOfferingsPaths,
  revalidateMajorsPaths,
  revalidateProgramMajorsPaths,
  revalidateProgramOfferingsPaths,
  revalidateProgramsPaths,
} from "./shared";

type ProgramInput = {
  college_id: string;
  code: string;
  name: string;
  description?: string | null;
};

type UpdateProgramInput = ProgramInput & {
  id: string;
};

const normalizeProgramInput = (input: ProgramInput) => ({
  college_id: input.college_id.trim(),
  code: normalizeCode(input.code),
  name: normalizeName(input.name),
  description: normalizeDescription(input.description),
});

export async function createProgram(
  input: ProgramInput,
): Promise<{ data?: { id: string }; error?: string }> {
  if (!input.college_id?.trim()) return { error: "College is required" };
  if (!input.code?.trim()) return { error: "Program code is required" };
  if (!input.name?.trim()) return { error: "Program name is required" };

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("program")
    .insert(normalizeProgramInput(input))
    .select("id")
    .single();

  if (error) {
    return { error: mapDuplicateError("Program", "code", error) };
  }

  revalidateProgramsPaths(data.id);
  revalidateDepartmentProgramsPaths(input.college_id, data.id);
  return { data: { id: data.id } };
}

export async function updateProgram(
  input: UpdateProgramInput,
): Promise<{ data?: boolean; error?: string }> {
  if (!input.id?.trim()) return { error: "Program ID is required" };
  if (!input.college_id?.trim()) return { error: "College is required" };
  if (!input.code?.trim()) return { error: "Program code is required" };
  if (!input.name?.trim()) return { error: "Program name is required" };

  const supabase = await createClient();

  const { error } = await supabase
    .from("program")
    .update(normalizeProgramInput(input))
    .eq("id", input.id);

  if (error) {
    return { error: mapDuplicateError("Program", "code", error) };
  }

  revalidateProgramsPaths(input.id);
  revalidateDepartmentProgramsPaths(input.college_id, input.id);
  return { data: true };
}

export async function deleteProgram(
  programId: string,
): Promise<{ data?: boolean; error?: string }> {
  if (!programId?.trim()) return { error: "Program ID is required" };

  const supabase = await createClient();

  const { data: existingProgram } = await supabase
    .from("program")
    .select("id, college_id")
    .eq("id", programId)
    .maybeSingle();

  const { error } = await supabase.from("program").delete().eq("id", programId);

  if (error) {
    return { error: error.message };
  }

  revalidateProgramsPaths();
  if (existingProgram?.college_id) {
    revalidateDepartmentProgramsPaths(existingProgram.college_id);
  }
  revalidateMajorsPaths();
  revalidateProgramOfferingsPaths();
  return { data: true };
}

type ProgramOfferingInput = {
  campus_id: string;
  program_id: string;
};

type UpdateProgramOfferingInput = ProgramOfferingInput & {
  id: string;
};

export async function createProgramOffering(
  input: ProgramOfferingInput,
): Promise<{ data?: { id: string }; error?: string }> {
  if (!input.campus_id?.trim()) return { error: "Campus is required" };
  if (!input.program_id?.trim()) return { error: "Program is required" };

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("program_offering")
    .insert({
      campus_id: input.campus_id.trim(),
      program_id: input.program_id.trim(),
    })
    .select("id")
    .single();

  if (error) {
    return {
      error: mapDuplicateError(
        "Program offering",
        "for this campus and program",
        error,
      ),
    };
  }

  revalidateProgramOfferingsPaths(data.id);
  return { data: { id: data.id } };
}

export async function updateProgramOffering(
  input: UpdateProgramOfferingInput,
): Promise<{ data?: boolean; error?: string }> {
  if (!input.id?.trim()) return { error: "Program offering ID is required" };
  if (!input.campus_id?.trim()) return { error: "Campus is required" };
  if (!input.program_id?.trim()) return { error: "Program is required" };

  const supabase = await createClient();

  const { error } = await supabase
    .from("program_offering")
    .update({
      campus_id: input.campus_id.trim(),
      program_id: input.program_id.trim(),
    })
    .eq("id", input.id);

  if (error) {
    return {
      error: mapDuplicateError(
        "Program offering",
        "for this campus and program",
        error,
      ),
    };
  }

  revalidateProgramOfferingsPaths(input.id);
  return { data: true };
}

export async function deleteProgramOffering(
  offeringId: string,
): Promise<{ data?: boolean; error?: string }> {
  if (!offeringId?.trim()) return { error: "Program offering ID is required" };

  const supabase = await createClient();

  const { error } = await supabase
    .from("program_offering")
    .delete()
    .eq("id", offeringId);

  if (error) {
    return { error: error.message };
  }

  revalidateProgramOfferingsPaths();
  revalidateMajorOfferingsPaths();
  return { data: true };
}

type MajorInput = {
  program_id: string;
  code: string;
  name: string;
  description?: string | null;
};

type UpdateMajorInput = MajorInput & {
  id: string;
};

const normalizeMajorInput = (input: MajorInput) => ({
  program_id: input.program_id.trim(),
  code: normalizeCode(input.code),
  name: normalizeName(input.name),
  description: normalizeDescription(input.description),
});

export async function createMajor(
  input: MajorInput,
): Promise<{ data?: { id: string }; error?: string }> {
  if (!input.program_id?.trim()) return { error: "Program is required" };
  if (!input.code?.trim()) return { error: "Major code is required" };
  if (!input.name?.trim()) return { error: "Major name is required" };

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("major")
    .insert(normalizeMajorInput(input))
    .select("id")
    .single();

  if (error) {
    return { error: mapDuplicateError("Major", "code in this program", error) };
  }

  revalidateMajorsPaths(data.id);
  const { data: parentProgram } = await supabase
    .from("program")
    .select("id, college_id")
    .eq("id", input.program_id)
    .maybeSingle();
  if (parentProgram?.college_id) {
    revalidateDepartmentProgramDetailPath(
      parentProgram.college_id,
      input.program_id,
    );
    revalidateProgramMajorsPaths(
      parentProgram.college_id,
      input.program_id,
      data.id,
    );
  }
  return { data: { id: data.id } };
}

export async function updateMajor(
  input: UpdateMajorInput,
): Promise<{ data?: boolean; error?: string }> {
  if (!input.id?.trim()) return { error: "Major ID is required" };
  if (!input.program_id?.trim()) return { error: "Program is required" };
  if (!input.code?.trim()) return { error: "Major code is required" };
  if (!input.name?.trim()) return { error: "Major name is required" };

  const supabase = await createClient();

  const { error } = await supabase
    .from("major")
    .update(normalizeMajorInput(input))
    .eq("id", input.id);

  if (error) {
    return { error: mapDuplicateError("Major", "code in this program", error) };
  }

  revalidateMajorsPaths(input.id);
  const { data: parentProgram } = await supabase
    .from("program")
    .select("id, college_id")
    .eq("id", input.program_id)
    .maybeSingle();
  if (parentProgram?.college_id) {
    revalidateDepartmentProgramDetailPath(
      parentProgram.college_id,
      input.program_id,
    );
    revalidateProgramMajorsPaths(
      parentProgram.college_id,
      input.program_id,
      input.id,
    );
  }
  return { data: true };
}

export async function deleteMajor(
  majorId: string,
): Promise<{ data?: boolean; error?: string }> {
  if (!majorId?.trim()) return { error: "Major ID is required" };

  const supabase = await createClient();

  const { data: existingMajor } = await supabase
    .from("major")
    .select("id, program_id")
    .eq("id", majorId)
    .maybeSingle();

  let departmentId: string | undefined;
  if (existingMajor?.program_id) {
    const { data: parentProgram } = await supabase
      .from("program")
      .select("college_id")
      .eq("id", existingMajor.program_id)
      .maybeSingle();
    departmentId = parentProgram?.college_id;
  }

  const { error } = await supabase.from("major").delete().eq("id", majorId);

  if (error) {
    return { error: error.message };
  }

  revalidateMajorsPaths();
  if (departmentId && existingMajor?.program_id) {
    revalidateDepartmentProgramDetailPath(
      departmentId,
      existingMajor.program_id,
    );
    revalidateProgramMajorsPaths(departmentId, existingMajor.program_id);
  }
  revalidateMajorOfferingsPaths();
  return { data: true };
}

type MajorOfferingInput = {
  program_offering_id: string;
  major_id: string;
};

type UpdateMajorOfferingInput = MajorOfferingInput & {
  id: string;
};

export async function createMajorOffering(
  input: MajorOfferingInput,
): Promise<{ data?: { id: string }; error?: string }> {
  if (!input.program_offering_id?.trim()) {
    return { error: "Program offering is required" };
  }
  if (!input.major_id?.trim()) return { error: "Major is required" };

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("major_offering")
    .insert({
      program_offering_id: input.program_offering_id.trim(),
      major_id: input.major_id.trim(),
    })
    .select("id")
    .single();

  if (error) {
    return {
      error: mapDuplicateError(
        "Major offering",
        "for this program offering and major",
        error,
      ),
    };
  }

  const { data: parentOffering } = await supabase
    .from("program_offering")
    .select("id, campus_id")
    .eq("id", input.program_offering_id)
    .maybeSingle();

  revalidateMajorOfferingsPaths(data.id);
  if (parentOffering?.campus_id) {
    revalidateCampusProgramOfferingDetailPath(
      parentOffering.campus_id,
      input.program_offering_id,
    );
    revalidateCampusProgramMajorOfferingsPaths(
      parentOffering.campus_id,
      input.program_offering_id,
      data.id,
    );
  }
  return { data: { id: data.id } };
}

export async function updateMajorOffering(
  input: UpdateMajorOfferingInput,
): Promise<{ data?: boolean; error?: string }> {
  if (!input.id?.trim()) return { error: "Major offering ID is required" };
  if (!input.program_offering_id?.trim()) {
    return { error: "Program offering is required" };
  }
  if (!input.major_id?.trim()) return { error: "Major is required" };

  const supabase = await createClient();

  const { error } = await supabase
    .from("major_offering")
    .update({
      program_offering_id: input.program_offering_id.trim(),
      major_id: input.major_id.trim(),
    })
    .eq("id", input.id);

  if (error) {
    return {
      error: mapDuplicateError(
        "Major offering",
        "for this program offering and major",
        error,
      ),
    };
  }

  const { data: parentOffering } = await supabase
    .from("program_offering")
    .select("id, campus_id")
    .eq("id", input.program_offering_id)
    .maybeSingle();

  revalidateMajorOfferingsPaths(input.id);
  if (parentOffering?.campus_id) {
    revalidateCampusProgramOfferingDetailPath(
      parentOffering.campus_id,
      input.program_offering_id,
    );
    revalidateCampusProgramMajorOfferingsPaths(
      parentOffering.campus_id,
      input.program_offering_id,
      input.id,
    );
  }
  return { data: true };
}

export async function deleteMajorOffering(
  majorOfferingId: string,
): Promise<{ data?: boolean; error?: string }> {
  if (!majorOfferingId?.trim())
    return { error: "Major offering ID is required" };

  const supabase = await createClient();

  const { data: existingMajorOffering } = await supabase
    .from("major_offering")
    .select("id, program_offering_id")
    .eq("id", majorOfferingId)
    .maybeSingle();

  let campusId: string | undefined;
  if (existingMajorOffering?.program_offering_id) {
    const { data: parentOffering } = await supabase
      .from("program_offering")
      .select("campus_id")
      .eq("id", existingMajorOffering.program_offering_id)
      .maybeSingle();
    campusId = parentOffering?.campus_id;
  }

  const { error } = await supabase
    .from("major_offering")
    .delete()
    .eq("id", majorOfferingId);

  if (error) {
    return { error: error.message };
  }

  revalidateMajorOfferingsPaths();
  if (campusId && existingMajorOffering?.program_offering_id) {
    revalidateCampusProgramOfferingDetailPath(
      campusId,
      existingMajorOffering.program_offering_id,
    );
    revalidateCampusProgramMajorOfferingsPaths(
      campusId,
      existingMajorOffering.program_offering_id,
    );
  }
  return { data: true };
}

type BlockInput = {
  major_offering_id: string;
  academic_term_id: string;
  year_level: number;
  section: string;
  student_count?: number | null;
};

type UpdateBlockInput = BlockInput & {
  id: string;
};

const normalizeBlockInput = (input: BlockInput) => ({
  major_offering_id: input.major_offering_id.trim(),
  academic_term_id: input.academic_term_id.trim(),
  year_level: input.year_level,
  section: normalizeCode(input.section),
  student_count: input.student_count ?? null,
});

export async function createBlock(
  input: BlockInput,
): Promise<{ data?: { id: string }; error?: string }> {
  if (!input.major_offering_id?.trim())
    return { error: "Major offering is required" };
  if (!input.academic_term_id?.trim())
    return { error: "Academic term is required" };
  if (!Number.isFinite(input.year_level) || input.year_level <= 0) {
    return { error: "Year level must be greater than zero" };
  }
  if (!input.section?.trim()) return { error: "Section is required" };
  if (
    input.student_count !== undefined &&
    input.student_count !== null &&
    (!Number.isFinite(input.student_count) || input.student_count < 0)
  ) {
    return { error: "Student count must be zero or greater" };
  }

  const supabase = await createClient();

  const [{ data: majorOffering }, { data: academicTerm }] = await Promise.all([
    supabase
      .from("major_offering")
      .select("id")
      .eq("id", input.major_offering_id)
      .maybeSingle(),
    supabase
      .from("academic_term")
      .select("id")
      .eq("id", input.academic_term_id)
      .maybeSingle(),
  ]);

  if (!majorOffering) {
    return { error: "Major offering not found" };
  }

  if (!academicTerm) {
    return { error: "Academic term not found" };
  }

  const { data, error } = await supabase
    .from("block")
    .insert(normalizeBlockInput(input))
    .select("id")
    .single();

  if (error) {
    return {
      error: mapDuplicateError(
        "Block",
        "for this major offering, year level, and section",
        error,
      ),
    };
  }

  revalidateBlocksPaths(input.academic_term_id, data.id);
  return { data: { id: data.id } };
}

export async function updateBlock(
  input: UpdateBlockInput,
): Promise<{ data?: boolean; error?: string }> {
  if (!input.id?.trim()) return { error: "Block ID is required" };
  if (!input.major_offering_id?.trim())
    return { error: "Major offering is required" };
  if (!input.academic_term_id?.trim())
    return { error: "Academic term is required" };
  if (!Number.isFinite(input.year_level) || input.year_level <= 0) {
    return { error: "Year level must be greater than zero" };
  }
  if (!input.section?.trim()) return { error: "Section is required" };
  if (
    input.student_count !== undefined &&
    input.student_count !== null &&
    (!Number.isFinite(input.student_count) || input.student_count < 0)
  ) {
    return { error: "Student count must be zero or greater" };
  }

  const supabase = await createClient();

  const [
    { data: majorOffering },
    { data: academicTerm },
    { data: existingBlock },
  ] = await Promise.all([
    supabase
      .from("major_offering")
      .select("id")
      .eq("id", input.major_offering_id)
      .maybeSingle(),
    supabase
      .from("academic_term")
      .select("id")
      .eq("id", input.academic_term_id)
      .maybeSingle(),
    supabase
      .from("block")
      .select("academic_term_id")
      .eq("id", input.id)
      .maybeSingle(),
  ]);

  if (!majorOffering) {
    return { error: "Major offering not found" };
  }

  if (!academicTerm) {
    return { error: "Academic term not found" };
  }

  const { error } = await supabase
    .from("block")
    .update(normalizeBlockInput(input))
    .eq("id", input.id);

  if (error) {
    return {
      error: mapDuplicateError(
        "Block",
        "for this major offering, year level, and section",
        error,
      ),
    };
  }

  revalidateBlocksPaths(input.academic_term_id, input.id);
  if (
    existingBlock?.academic_term_id &&
    existingBlock.academic_term_id !== input.academic_term_id
  ) {
    revalidateBlocksPaths(existingBlock.academic_term_id, input.id);
  }
  return { data: true };
}

export async function deleteBlock(
  blockId: string,
): Promise<{ data?: boolean; error?: string }> {
  if (!blockId?.trim()) return { error: "Block ID is required" };

  const supabase = await createClient();
  const { data: existingBlock } = await supabase
    .from("block")
    .select("academic_term_id")
    .eq("id", blockId)
    .maybeSingle();
  const { error } = await supabase.from("block").delete().eq("id", blockId);

  if (error) {
    return { error: error.message };
  }

  revalidateBlocksPaths(existingBlock?.academic_term_id);
  return { data: true };
}
