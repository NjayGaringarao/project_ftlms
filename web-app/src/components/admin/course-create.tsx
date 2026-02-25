"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import AdminPanel from "./admin-panel";
import FormStatusBanner from "./form-status-banner";
import { createCourse } from "@/lib/admin/actions";

export const CourseCreate = () => {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [title, setTitle] = useState("");
  const [lectureHour, setLectureHour] = useState("0");
  const [laboratoryHour, setLaboratoryHour] = useState("0");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);

  const handleCreate = async () => {
    const parsedLecture = Number(lectureHour);
    const parsedLaboratory = Number(laboratoryHour);

    if (!code.trim()) return setError("Course code is required");
    if (!title.trim()) return setError("Course title is required");
    if (!Number.isFinite(parsedLecture) || parsedLecture < 0) {
      return setError("Lecture hour must be zero or greater");
    }
    if (!Number.isFinite(parsedLaboratory) || parsedLaboratory < 0) {
      return setError("Laboratory hour must be zero or greater");
    }

    setIsSaving(true);
    setError("");
    setShowSuccess(false);

    const { data, error: createError } = await createCourse({
      code,
      title,
      lecture_hour: parsedLecture,
      laboratory_hour: parsedLaboratory,
    });

    setIsSaving(false);

    if (createError) {
      setError(createError);
      return;
    }

    setShowSuccess(true);

    setTimeout(() => {
      if (data?.id) {
        router.push(`/courses/${data.id}`);
      } else {
        router.push("/courses");
      }
    }, 1200);
  };

  return (
    <AdminPanel
      title="Course Information"
      icon={Plus}
      onClose={() => router.push("/courses")}
    >
      <div className="space-y-4">
        <FormStatusBanner
          success={
            showSuccess
              ? {
                  title: "Course created",
                  message: "Record created successfully. Redirecting...",
                }
              : undefined
          }
          error={error}
        />

        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b">
            <h3 className="font-semibold">Course Profile</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-xs" htmlFor="code">
                Course Code *
              </Label>
              <Input
                id="code"
                value={code}
                onChange={(event) => {
                  setCode(event.target.value);
                  setError("");
                }}
                onBlur={(event) =>
                  setCode(event.target.value.trim().toUpperCase())
                }
                className="mt-1"
                disabled={isSaving}
              />
            </div>

            <div>
              <Label className="text-xs" htmlFor="title">
                Course Title *
              </Label>
              <Input
                id="title"
                value={title}
                onChange={(event) => {
                  setTitle(event.target.value);
                  setError("");
                }}
                onBlur={(event) => setTitle(event.target.value.trim())}
                className="mt-1"
                disabled={isSaving}
              />
            </div>

            <div>
              <Label className="text-xs" htmlFor="lecture-hour">
                Lecture Hour
              </Label>
              <Input
                id="lecture-hour"
                type="number"
                min="0"
                step="0.25"
                value={lectureHour}
                onChange={(event) => {
                  setLectureHour(event.target.value);
                  setError("");
                }}
                className="mt-1"
                disabled={isSaving}
              />
            </div>

            <div>
              <Label className="text-xs" htmlFor="laboratory-hour">
                Laboratory Hour
              </Label>
              <Input
                id="laboratory-hour"
                type="number"
                min="0"
                step="0.25"
                value={laboratoryHour}
                onChange={(event) => {
                  setLaboratoryHour(event.target.value);
                  setError("");
                }}
                className="mt-1"
                disabled={isSaving}
              />
            </div>
          </div>

          <div className="flex gap-2 justify-end pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => {
                setCode("");
                setTitle("");
                setLectureHour("0");
                setLaboratoryHour("0");
                setError("");
                setShowSuccess(false);
              }}
              disabled={isSaving}
            >
              Reset
            </Button>
            <Button onClick={handleCreate} disabled={isSaving}>
              {isSaving ? "Creating..." : "Create Course"}
            </Button>
          </div>
        </div>
      </div>
    </AdminPanel>
  );
};
