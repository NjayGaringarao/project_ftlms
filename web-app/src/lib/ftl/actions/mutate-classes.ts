"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { MutationResult } from "../types";
import { ensureProgramChair } from "./auth";
import { assertScheduleIsFresh, touchSchedule } from "./mutation-shared";
import { asObject, asString, RowObject } from "./shared";

export const createClass = async (input: {
  schedule_id: string;
  course_offering_id: string;
  block_id: string | null;
  expected_schedule_updated_at: string | null;
  force_stale_save?: boolean;
}): Promise<MutationResult> => {
  await ensureProgramChair();
  const supabase = await createClient();

  const staleError = await assertScheduleIsFresh(
    input.schedule_id,
    input.expected_schedule_updated_at,
    Boolean(input.force_stale_save),
  );
  if (staleError) return { error: staleError };

  const { data: existingAllocation, error: existingAllocationError } =
    await supabase
      .from("course_allocation")
      .select("id")
      .eq("schedule_id", input.schedule_id)
      .eq("course_offering_id", input.course_offering_id)
      .maybeSingle();

  if (existingAllocationError) {
    console.error(
      "lib.ftl.createClass existingAllocation::",
      existingAllocationError,
    );
    return { error: existingAllocationError.message ?? "Unable to add class" };
  }

  let courseAllocationId = existingAllocation?.id ?? null;

  if (!courseAllocationId) {
    const { data: insertedAllocation, error: insertAllocationError } =
      await supabase
        .from("course_allocation")
        .insert({
          schedule_id: input.schedule_id,
          course_offering_id: input.course_offering_id,
        })
        .select("id")
        .single();

    if (insertAllocationError) {
      console.error(
        "lib.ftl.createClass insertAllocation::",
        insertAllocationError,
      );
      return { error: insertAllocationError.message ?? "Unable to add class" };
    }

    courseAllocationId = insertedAllocation.id;
  }

  if (input.block_id) {
    const { data: duplicateBlockLinks, error: duplicateBlockLinksError } =
      await supabase
        .from("class_delivery_block")
        .select(
          `
          block_id,
          class_delivery:class_delivery!inner(
            course_allocation:course_allocation!inner(id)
          )
        `,
        )
        .eq("class_delivery.course_allocation.id", courseAllocationId)
        .eq("block_id", input.block_id)
        .limit(1);

    if (duplicateBlockLinksError) {
      console.error(
        "lib.ftl.createClass duplicateBlockLinks::",
        duplicateBlockLinksError,
      );
      return {
        error: duplicateBlockLinksError.message ?? "Unable to validate class",
      };
    }

    if ((duplicateBlockLinks ?? []).length > 0) {
      return {
        error:
          "This course and block are already listed in Step 2 for this schedule.",
      };
    }
  }

  const { data: insertedDelivery, error: insertDeliveryError } = await supabase
    .from("class_delivery")
    .insert({
      course_allocation_id: courseAllocationId,
    })
    .select("id")
    .single();

  if (insertDeliveryError) {
    console.error("lib.ftl.createClass insertDelivery::", insertDeliveryError);
    return { error: insertDeliveryError.message ?? "Unable to add class" };
  }

  const classDeliveryId = insertedDelivery.id;

  if (input.block_id && classDeliveryId) {
    const { error: blockLinkError } = await supabase
      .from("class_delivery_block")
      .upsert(
        {
          class_delivery_id: classDeliveryId,
          block_id: input.block_id,
        },
        {
          onConflict: "class_delivery_id,block_id",
          ignoreDuplicates: true,
        },
      );

    if (blockLinkError) {
      console.error("lib.ftl.createClass blockLink::", blockLinkError);
      return { error: blockLinkError.message ?? "Unable to add class block" };
    }
  }

  await touchSchedule(input.schedule_id);
  revalidatePath("/ftl");
  return { error: null };
};

export const mergeClassDeliveries = async (input: {
  schedule_id: string;
  source_class_id: string;
  target_class_id: string;
  expected_schedule_updated_at: string | null;
  force_stale_save?: boolean;
}): Promise<MutationResult> => {
  await ensureProgramChair();
  const supabase = await createClient();

  if (input.source_class_id === input.target_class_id) {
    return { error: "Source and target class must be different." };
  }

  const staleError = await assertScheduleIsFresh(
    input.schedule_id,
    input.expected_schedule_updated_at,
    Boolean(input.force_stale_save),
  );
  if (staleError) return { error: staleError };

  const { data: classesRaw, error: classesError } = await supabase
    .from("class_delivery")
    .select(
      `
      id,
      course_allocation_id,
      course_allocation:course_allocation!inner(
        id,
        schedule_id,
        course_offering:course_offering!inner(
          course:course!inner(code)
        )
      ),
      class_delivery_block(id, block_id)
    `,
    )
    .eq("course_allocation.schedule_id", input.schedule_id)
    .in("id", [input.source_class_id, input.target_class_id]);

  if (classesError) {
    console.error("lib.ftl.mergeClassDeliveries classes::", classesError);
    return { error: classesError.message ?? "Unable to load classes to merge" };
  }

  const classes = (classesRaw ?? []).map((raw) => raw as RowObject);
  if (classes.length !== 2) {
    return { error: "Unable to find source and target classes in schedule." };
  }

  const source = classes.find(
    (row) => asString(row.id) === input.source_class_id,
  );
  const target = classes.find(
    (row) => asString(row.id) === input.target_class_id,
  );

  if (!source || !target) {
    return { error: "Unable to resolve selected classes for merge." };
  }

  const sourceAllocation = asObject(source.course_allocation);
  const targetAllocation = asObject(target.course_allocation);
  const sourceOffering = asObject(sourceAllocation?.course_offering);
  const targetOffering = asObject(targetAllocation?.course_offering);
  const sourceCourse = asObject(sourceOffering?.course);
  const targetCourse = asObject(targetOffering?.course);
  const sourceCode = asString(sourceCourse?.code);
  const targetCode = asString(targetCourse?.code);

  if (!sourceCode || !targetCode || sourceCode !== targetCode) {
    return { error: "Only classes with the same course code can be merged." };
  }

  const sourceBlockLinks =
    (source.class_delivery_block as RowObject[] | undefined) ?? [];

  if (sourceBlockLinks.length === 0) {
    return { error: "Source class has no block links to merge." };
  }

  const blockRowsToInsert = sourceBlockLinks
    .map((item) => asString(item.block_id))
    .filter((item): item is string => Boolean(item))
    .map((blockId) => ({
      class_delivery_id: input.target_class_id,
      block_id: blockId,
    }));

  if (blockRowsToInsert.length > 0) {
    const { error: insertBlocksError } = await supabase
      .from("class_delivery_block")
      .upsert(blockRowsToInsert, {
        onConflict: "class_delivery_id,block_id",
        ignoreDuplicates: true,
      });

    if (insertBlocksError) {
      console.error(
        "lib.ftl.mergeClassDeliveries insertBlocks::",
        insertBlocksError,
      );
      return { error: insertBlocksError.message ?? "Unable to merge blocks" };
    }
  }

  const { error: deleteSourceSessionsError } = await supabase
    .from("session")
    .delete()
    .eq("class_delivery_id", input.source_class_id);

  if (deleteSourceSessionsError) {
    console.error(
      "lib.ftl.mergeClassDeliveries deleteSourceSessions::",
      deleteSourceSessionsError,
    );
    return {
      error:
        deleteSourceSessionsError.message ??
        "Unable to clear source sessions during merge",
    };
  }

  const { error: deleteSourceClassError } = await supabase
    .from("class_delivery")
    .delete()
    .eq("id", input.source_class_id);

  if (deleteSourceClassError) {
    console.error(
      "lib.ftl.mergeClassDeliveries deleteSourceClass::",
      deleteSourceClassError,
    );
    return {
      error:
        deleteSourceClassError.message ??
        "Unable to finalize merged class cleanup",
    };
  }

  await touchSchedule(input.schedule_id);
  revalidatePath("/ftl");
  return { error: null };
};

export const unmergeClassBlock = async (input: {
  schedule_id: string;
  class_id: string;
  block_id: string;
  expected_schedule_updated_at: string | null;
  remove_sessions: boolean;
  force_stale_save?: boolean;
}): Promise<MutationResult> => {
  await ensureProgramChair();
  const supabase = await createClient();

  const staleError = await assertScheduleIsFresh(
    input.schedule_id,
    input.expected_schedule_updated_at,
    Boolean(input.force_stale_save),
  );
  if (staleError) return { error: staleError };

  const { data: classRaw, error: classError } = await supabase
    .from("class_delivery")
    .select(
      `
      id,
      course_allocation_id,
      course_allocation:course_allocation!inner(schedule_id),
      class_delivery_block(id, block_id)
    `,
    )
    .eq("id", input.class_id)
    .eq("course_allocation.schedule_id", input.schedule_id)
    .maybeSingle();

  if (classError) {
    console.error("lib.ftl.unmergeClassBlock class::", classError);
    return {
      error: classError.message ?? "Unable to load class for unmerge",
    };
  }

  if (!classRaw) {
    return { error: "Class to unmerge was not found in this schedule." };
  }

  const classRow = classRaw as RowObject;
  const courseAllocationId = asString(classRow.course_allocation_id);
  const blockLinks =
    (classRow.class_delivery_block as RowObject[] | undefined) ?? [];

  if (!courseAllocationId) {
    return { error: "Class is missing allocation reference." };
  }

  if (blockLinks.length <= 1) {
    return { error: "This class has only one block and cannot be unmerged." };
  }

  const blockLinkToMove = blockLinks.find(
    (item) => asString(item.block_id) === input.block_id,
  );

  if (!blockLinkToMove) {
    return { error: "Selected block is not linked to this class." };
  }

  const { data: newClass, error: createClassError } = await supabase
    .from("class_delivery")
    .insert({
      course_allocation_id: courseAllocationId,
    })
    .select("id")
    .single();

  if (createClassError) {
    console.error("lib.ftl.unmergeClassBlock createClass::", createClassError);
    return {
      error: createClassError.message ?? "Unable to create unmerged class",
    };
  }

  const { error: moveBlockError } = await supabase
    .from("class_delivery_block")
    .update({ class_delivery_id: newClass.id })
    .eq("id", asString(blockLinkToMove.id) ?? "");

  if (moveBlockError) {
    console.error("lib.ftl.unmergeClassBlock moveBlock::", moveBlockError);
    return { error: moveBlockError.message ?? "Unable to move block" };
  }

  if (input.remove_sessions) {
    const { error: deleteSessionsError } = await supabase
      .from("session")
      .delete()
      .eq("class_delivery_id", input.class_id);

    if (deleteSessionsError) {
      console.error(
        "lib.ftl.unmergeClassBlock deleteSessions::",
        deleteSessionsError,
      );
      return {
        error:
          deleteSessionsError.message ??
          "Unable to remove sessions during unmerge",
      };
    }
  }

  await touchSchedule(input.schedule_id);
  revalidatePath("/ftl");
  return { error: null };
};

export const updateClass = async (input: {
  class_id: string;
  schedule_id: string;
  course_offering_id: string;
  block_id: string | null;
  expected_schedule_updated_at: string | null;
  force_stale_save?: boolean;
}): Promise<MutationResult> => {
  await ensureProgramChair();
  const supabase = await createClient();

  const staleError = await assertScheduleIsFresh(
    input.schedule_id,
    input.expected_schedule_updated_at,
    Boolean(input.force_stale_save),
  );
  if (staleError) return { error: staleError };

  const { data: classDelivery, error: classDeliveryError } = await supabase
    .from("class_delivery")
    .select("course_allocation_id")
    .eq("id", input.class_id)
    .maybeSingle();

  if (classDeliveryError || !classDelivery?.course_allocation_id) {
    return { error: classDeliveryError?.message ?? "Class delivery not found" };
  }

  const { error } = await supabase
    .from("course_allocation")
    .update({
      course_offering_id: input.course_offering_id,
    })
    .eq("id", classDelivery.course_allocation_id);

  if (error) {
    console.error("lib.ftl.updateClass ::", error);
    return { error: error.message ?? "Unable to update class" };
  }

  if (input.block_id) {
    const { error: blockLinkError } = await supabase
      .from("class_delivery_block")
      .upsert(
        {
          class_delivery_id: input.class_id,
          block_id: input.block_id,
        },
        {
          onConflict: "class_delivery_id,block_id",
          ignoreDuplicates: true,
        },
      );

    if (blockLinkError) {
      console.error("lib.ftl.updateClass blockLink::", blockLinkError);
      return {
        error: blockLinkError.message ?? "Unable to update class block",
      };
    }
  }

  await touchSchedule(input.schedule_id);
  revalidatePath("/ftl");
  return { error: null };
};

export const deleteClass = async (input: {
  class_id: string;
  schedule_id: string;
  expected_schedule_updated_at: string | null;
  force_stale_save?: boolean;
}): Promise<MutationResult> => {
  await ensureProgramChair();
  const supabase = await createClient();

  const staleError = await assertScheduleIsFresh(
    input.schedule_id,
    input.expected_schedule_updated_at,
    Boolean(input.force_stale_save),
  );
  if (staleError) return { error: staleError };

  const { error } = await supabase
    .from("class_delivery")
    .delete()
    .eq("id", input.class_id);

  if (error) {
    console.error("lib.ftl.deleteClass ::", error);
    return { error: error.message ?? "Unable to delete class" };
  }

  await touchSchedule(input.schedule_id);
  revalidatePath("/ftl");
  return { error: null };
};

export const deleteClassesByCourseOffering = async (input: {
  schedule_id: string;
  course_offering_id: string;
  expected_schedule_updated_at: string | null;
  force_stale_save?: boolean;
}): Promise<MutationResult> => {
  await ensureProgramChair();
  const supabase = await createClient();

  const staleError = await assertScheduleIsFresh(
    input.schedule_id,
    input.expected_schedule_updated_at,
    Boolean(input.force_stale_save),
  );
  if (staleError) return { error: staleError };

  const { data: allocations, error: allocationsError } = await supabase
    .from("course_allocation")
    .select("id")
    .eq("schedule_id", input.schedule_id)
    .eq("course_offering_id", input.course_offering_id);

  if (allocationsError) {
    console.error(
      "lib.ftl.deleteClassesByCourseOffering allocations::",
      allocationsError,
    );
    return {
      error:
        allocationsError.message ?? "Unable to remove course from schedule",
    };
  }

  const allocationIds = (allocations ?? [])
    .map((item) => item.id)
    .filter((item): item is string => Boolean(item));

  if (allocationIds.length === 0) {
    return { error: null };
  }

  const { error: deleteDeliveryError } = await supabase
    .from("class_delivery")
    .delete()
    .in("course_allocation_id", allocationIds);

  if (deleteDeliveryError) {
    console.error(
      "lib.ftl.deleteClassesByCourseOffering class_delivery::",
      deleteDeliveryError,
    );
    return {
      error: deleteDeliveryError.message ?? "Unable to remove class delivery",
    };
  }

  const { error: deleteAllocationError } = await supabase
    .from("course_allocation")
    .delete()
    .in("id", allocationIds);

  if (deleteAllocationError) {
    console.error(
      "lib.ftl.deleteClassesByCourseOffering course_allocation::",
      deleteAllocationError,
    );
    return {
      error:
        deleteAllocationError.message ?? "Unable to remove course allocation",
    };
  }

  await touchSchedule(input.schedule_id);
  revalidatePath("/ftl");
  return { error: null };
};

export const pruneScheduleByCampuses = async (input: {
  schedule_id: string;
  campus_ids: string[];
  expected_schedule_updated_at: string | null;
  force_stale_save?: boolean;
}): Promise<MutationResult> => {
  await ensureProgramChair();
  const supabase = await createClient();

  const staleError = await assertScheduleIsFresh(
    input.schedule_id,
    input.expected_schedule_updated_at,
    Boolean(input.force_stale_save),
  );
  if (staleError) return { error: staleError };

  const keptCampusIds = new Set(input.campus_ids.filter(Boolean));

  const { data: deliveriesRaw, error: deliveriesError } = await supabase
    .from("class_delivery")
    .select(
      `
      id,
      course_allocation:course_allocation!inner(schedule_id),
      class_delivery_block(
        id,
        block:block!inner(
          major_offering:major_offering!inner(
            program_offering:program_offering!inner(campus_id)
          )
        )
      )
    `,
    )
    .eq("course_allocation.schedule_id", input.schedule_id);

  if (deliveriesError) {
    console.error(
      "lib.ftl.pruneScheduleByCampuses deliveries::",
      deliveriesError,
    );
    return {
      error: deliveriesError.message ?? "Unable to prune schedule by campus",
    };
  }

  const blockLinkIdsToDelete: string[] = [];
  const classDeliveryIdsToDelete: string[] = [];

  for (const raw of deliveriesRaw ?? []) {
    const row = raw as RowObject;
    const classDeliveryId = asString(row.id);
    if (!classDeliveryId) continue;

    const blockLinks =
      (row.class_delivery_block as RowObject[] | undefined) ?? [];

    let hasKeptCampus = false;

    for (const link of blockLinks) {
      const linkId = asString(link.id);
      const block = asObject(link.block);
      const majorOffering = asObject(block?.major_offering);
      const programOffering = asObject(majorOffering?.program_offering);
      const campusId = asString(programOffering?.campus_id);

      if (campusId && keptCampusIds.has(campusId)) {
        hasKeptCampus = true;
      } else if (linkId) {
        blockLinkIdsToDelete.push(linkId);
      }
    }

    if (!hasKeptCampus || keptCampusIds.size === 0) {
      classDeliveryIdsToDelete.push(classDeliveryId);
    }
  }

  if (blockLinkIdsToDelete.length > 0) {
    const { error: deleteLinksError } = await supabase
      .from("class_delivery_block")
      .delete()
      .in("id", blockLinkIdsToDelete);

    if (deleteLinksError) {
      console.error(
        "lib.ftl.pruneScheduleByCampuses delete links::",
        deleteLinksError,
      );
      return {
        error:
          deleteLinksError.message ??
          "Unable to remove campus-related class links",
      };
    }
  }

  if (classDeliveryIdsToDelete.length > 0) {
    const { error: deleteDeliveriesError } = await supabase
      .from("class_delivery")
      .delete()
      .in("id", classDeliveryIdsToDelete);

    if (deleteDeliveriesError) {
      console.error(
        "lib.ftl.pruneScheduleByCampuses delete deliveries::",
        deleteDeliveriesError,
      );
      return {
        error:
          deleteDeliveriesError.message ??
          "Unable to remove campus-related classes",
      };
    }
  }

  const [
    { data: allocationRows, error: allocationError },
    { data: activeDeliveries, error: activeDeliveriesError },
  ] = await Promise.all([
    supabase
      .from("course_allocation")
      .select("id")
      .eq("schedule_id", input.schedule_id),
    supabase
      .from("class_delivery")
      .select(
        "course_allocation_id, course_allocation:course_allocation!inner(schedule_id)",
      )
      .eq("course_allocation.schedule_id", input.schedule_id),
  ]);

  if (allocationError || activeDeliveriesError) {
    console.error(
      "lib.ftl.pruneScheduleByCampuses cleanup::",
      allocationError ?? activeDeliveriesError,
    );
    return {
      error:
        allocationError?.message ??
        activeDeliveriesError?.message ??
        "Unable to clean course allocations",
    };
  }

  const referencedAllocationIds = new Set(
    (activeDeliveries ?? [])
      .map((item) => item.course_allocation_id)
      .filter((item): item is string => Boolean(item)),
  );

  const orphanAllocationIds = (allocationRows ?? [])
    .map((item) => item.id)
    .filter((item): item is string => Boolean(item))
    .filter((item) => !referencedAllocationIds.has(item));

  if (orphanAllocationIds.length > 0) {
    const { error: deleteOrphanError } = await supabase
      .from("course_allocation")
      .delete()
      .in("id", orphanAllocationIds);

    if (deleteOrphanError) {
      console.error(
        "lib.ftl.pruneScheduleByCampuses delete orphans::",
        deleteOrphanError,
      );
      return {
        error:
          deleteOrphanError.message ??
          "Unable to remove orphan course allocations",
      };
    }
  }

  await touchSchedule(input.schedule_id);
  revalidatePath("/ftl");
  return { error: null };
};
