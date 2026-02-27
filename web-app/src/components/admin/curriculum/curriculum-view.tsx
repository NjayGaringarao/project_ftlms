"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Info, BookCopy, CalendarDays, Trash2 } from "lucide-react";
import AdminPanel from "../admin-panel";
import DangerZone from "../danger-zone";
import DeleteConfirmModal from "../delete-confirm-modal";
import { AddTile } from "@/components/ui/add-tile";
import { Button } from "@/components/ui/button";
import {
  CurriculumListItem,
  CurriculumTermCourseLink,
} from "@/lib/admin/curriculums";
import { CourseListItem } from "@/lib/admin/courses";
import { TermListItem } from "@/lib/admin/terms";
import {
  addCoursesToCurriculumTerm,
  createCurriculumTermLink,
  deleteCurriculum,
  deleteCurriculumTermCourseLink,
  deleteCurriculumTermLink,
} from "@/lib/admin/actions";
import { TermPickerModal } from "./term-picker-modal";
import { CoursePickerModal } from "./course-picker-modal";

type CurriculumViewProps = {
  curriculum: CurriculumListItem;
  termCourseLinks: CurriculumTermCourseLink[];
  availableTerms: TermListItem[];
  availableCourses: CourseListItem[];
  basePath: string;
};

export const CurriculumView = ({
  curriculum,
  termCourseLinks,
  availableTerms,
  availableCourses,
  basePath = "/curriculums",
}: CurriculumViewProps) => {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [showTermPicker, setShowTermPicker] = useState(false);
  const [termQuery, setTermQuery] = useState("");
  const [termActionError, setTermActionError] = useState("");
  const [isAddingTerm, setIsAddingTerm] = useState(false);
  const [activeCourseTermId, setActiveCourseTermId] = useState<string | null>(
    null,
  );
  const [courseQuery, setCourseQuery] = useState("");
  const [courseActionError, setCourseActionError] = useState("");
  const [isAddingCourses, setIsAddingCourses] = useState(false);
  const [removingTermId, setRemovingTermId] = useState<string | null>(null);
  const [removingCourseLinkId, setRemovingCourseLinkId] = useState<
    string | null
  >(null);

  const linkedTermIds = termCourseLinks.map((item) => item.term.id);
  const activeCourseTerm = termCourseLinks.find(
    (item) => item.id === activeCourseTermId,
  );

  const formatTermSummary = (courses: CurriculumTermCourseLink["courses"]) => {
    const totalLectureHours = courses.reduce(
      (sum, item) => sum + (item.course.lecture_hour ?? 0),
      0,
    );
    const totalLaboratoryHours = courses.reduce(
      (sum, item) => sum + (item.course.laboratory_hour ?? 0),
      0,
    );
    const totalUnits = totalLectureHours * 1 + totalLaboratoryHours * 0.75;

    return `Total Unit: ${totalUnits.toFixed(2)} • Total Laboratory: ${totalLaboratoryHours} • Total Lecture: ${totalLectureHours}`;
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    setDeleteError("");

    const { error } = await deleteCurriculum(curriculum.id);

    if (error) {
      setDeleteError(error);
      setIsDeleting(false);
      return;
    }

    setShowDeleteConfirm(false);
    router.push(basePath);
  };

  const handleAddTerm = async (termId: string) => {
    setIsAddingTerm(true);
    setTermActionError("");

    const { error } = await createCurriculumTermLink({
      curriculum_id: curriculum.id,
      academic_term_id: termId,
    });

    if (error) {
      setTermActionError(error);
      setIsAddingTerm(false);
      return;
    }

    setIsAddingTerm(false);
    setShowTermPicker(false);
    setTermQuery("");
    router.refresh();
  };

  const handleDeleteTerm = async (curriculumAtId: string) => {
    setRemovingTermId(curriculumAtId);
    setTermActionError("");

    const { error } = await deleteCurriculumTermLink(curriculumAtId);

    if (error) {
      setTermActionError(error);
      setRemovingTermId(null);
      return;
    }

    setRemovingTermId(null);
    router.refresh();
  };

  const handleAddCourses = async (courseIds: string[]) => {
    if (!activeCourseTermId) return;

    setIsAddingCourses(true);
    setCourseActionError("");

    const { error } = await addCoursesToCurriculumTerm({
      curriculum_at_id: activeCourseTermId,
      course_ids: courseIds,
    });

    if (error) {
      setCourseActionError(error);
      setIsAddingCourses(false);
      return;
    }

    setIsAddingCourses(false);
    setActiveCourseTermId(null);
    setCourseQuery("");
    router.refresh();
  };

  const handleDeleteCourse = async (courseLinkId: string) => {
    setRemovingCourseLinkId(courseLinkId);
    setCourseActionError("");

    const { error } = await deleteCurriculumTermCourseLink(courseLinkId);

    if (error) {
      setCourseActionError(error);
      setRemovingCourseLinkId(null);
      return;
    }

    setRemovingCourseLinkId(null);
    router.refresh();
  };

  return (
    <AdminPanel
      title="Curriculum Information"
      icon={Info}
      onClose={() => router.push(basePath)}
      onEdit={() => router.push(`${basePath}/${curriculum.id}/edit`)}
    >
      <>
        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b">
            <BookCopy className="w-5 h-5" />
            <h3 className="text-base font-semibold">Curriculum Profile</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <p className="text-xs text-foreground/60">Title</p>
              <p className="font-medium">{curriculum.title}</p>
            </div>
            <div>
              <p className="text-xs text-foreground/60">Series Year</p>
              <p className="font-medium">{curriculum.series_year}</p>
            </div>
            <div>
              <p className="text-xs text-foreground/60">Revised Year</p>
              <p className="font-medium">
                {curriculum.revised_year ?? "Not revised"}
              </p>
            </div>
            <div className="md:col-span-2">
              <p className="text-xs text-foreground/60">Major</p>
              <p className="font-medium">
                {curriculum.major?.program?.code
                  ? `${curriculum.major.program.code} - `
                  : ""}
                {curriculum.major?.name ?? "Unknown"}
                {curriculum.major?.code ? ` (${curriculum.major.code})` : ""}
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b">
            <CalendarDays className="w-5 h-5" />
            <h3 className="text-base font-semibold">Courses</h3>
          </div>

          {termActionError && (
            <p className="rounded-md border border-red-200 bg-red-50 p-2 text-xs text-red-900">
              {termActionError}
            </p>
          )}

          {courseActionError && (
            <p className="rounded-md border border-red-200 bg-red-50 p-2 text-xs text-red-900">
              {courseActionError}
            </p>
          )}

          <div className="space-y-3">
            {termCourseLinks.map((link) => (
              <div key={link.id} className="space-y-3 rounded-md border p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold">{link.term.code}</p>
                    <p className="text-xs text-foreground/70">
                      {formatTermSummary(link.courses)}
                    </p>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => handleDeleteTerm(link.id)}
                    disabled={removingTermId === link.id}
                  >
                    {removingTermId === link.id ? "Removing..." : "Remove Term"}
                  </Button>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {link.courses.length === 0 && (
                    <p className="text-xs text-foreground/70">
                      No courses linked to this term.
                    </p>
                  )}

                  {link.courses.map((courseLink) => (
                    <div
                      key={courseLink.id}
                      className="flex items-center justify-between gap-2 rounded-md border px-3 py-2"
                    >
                      <div>
                        <p className="text-sm">{courseLink.course.code}</p>
                        <p className="text-xs text-foreground/70 line-clamp-1">
                          {courseLink.course.title}
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => handleDeleteCourse(courseLink.id)}
                        disabled={removingCourseLinkId === courseLink.id}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <AddTile
                    title="Add Courses"
                    description="Open searchable course list"
                    className="p-2 bg-foreground/5"
                    onClick={() => {
                      setCourseActionError("");
                      setCourseQuery("");
                      setActiveCourseTermId(link.id);
                    }}
                  />
                </div>
              </div>
            ))}

            <AddTile
              title="Add Term"
              description="Select an academic term to attach courses into it."
              onClick={() => {
                setTermActionError("");
                setTermQuery("");
                setShowTermPicker(true);
              }}
            />
          </div>
        </div>

        <DangerZone
          description="Deleting this curriculum removes linked curriculum terms and linked curriculum courses."
          buttonLabel="Delete Curriculum"
          onDeleteClick={() => setShowDeleteConfirm(true)}
          disabled={isDeleting}
        />

        <DeleteConfirmModal
          isOpen={showDeleteConfirm}
          title="Delete Curriculum"
          description={
            <p>
              Are you sure you want to delete{" "}
              <strong>{curriculum.title}</strong>?
            </p>
          }
          confirmLabel="Delete Curriculum"
          isDeleting={isDeleting}
          error={deleteError}
          onCancel={() => setShowDeleteConfirm(false)}
          onConfirm={handleDelete}
        />

        <TermPickerModal
          open={showTermPicker}
          onOpenChange={setShowTermPicker}
          terms={availableTerms}
          linkedTermIds={linkedTermIds}
          query={termQuery}
          onQueryChange={setTermQuery}
          isLoading={isAddingTerm}
          error={termActionError}
          onSelect={handleAddTerm}
        />

        <CoursePickerModal
          open={!!activeCourseTermId}
          onOpenChange={(open) => {
            if (!open) {
              setActiveCourseTermId(null);
              setCourseActionError("");
            }
          }}
          courses={availableCourses}
          linkedCourseIds={
            activeCourseTerm?.courses.map((item) => item.course_id) ?? []
          }
          query={courseQuery}
          onQueryChange={setCourseQuery}
          isLoading={isAddingCourses}
          error={courseActionError}
          onSubmit={handleAddCourses}
        />
      </>
    </AdminPanel>
  );
};
