"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { NotebookTabs } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CardContent, CardHeader } from "@/components/ui/card";
import { cn } from "@/utils/style";
import { useListState } from "@/hooks/useListState";
import ListItem from "../list-item";
import { CourseListItem } from "@/lib/admin/courses";
import AdminListContainer from "../admin-list-container";

type CoursesListProps = {
  courses: CourseListItem[];
};

export const CoursesList = ({ courses }: CoursesListProps) => {
  const router = useRouter();
  const { query, setQuery, selectedId, filteredItems } = useListState({
    items: courses,
    match: /\/courses\/([^\/]+)/,
    filter: (items, rawQuery) => {
      const q = rawQuery.trim().toLowerCase();
      if (!q) return items;

      return items.filter((course) => {
        const code = course.code.toLowerCase();
        const title = course.title.toLowerCase();
        const lecture = String(course.lecture_hour ?? 0);
        const laboratory = String(course.laboratory_hour ?? 0);

        return (
          code.includes(q) ||
          title.includes(q) ||
          lecture.includes(q) ||
          laboratory.includes(q)
        );
      });
    },
  });

  return (
    <AdminListContainer
      header={
        <>
          <Input
            placeholder="Search by code, title, lecture hour, or laboratory hour"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <Button asChild>
            <Link href="/courses/create">Create Course</Link>
          </Button>
        </>
      }
      isItemSelected={!!selectedId}
    >
      {filteredItems.length === 0 && (
        <div className="rounded-md border border-dashed p-6 text-center text-sm text-foreground/70">
          No courses match your search.
        </div>
      )}

      {filteredItems.map((course) => (
        <ListItem
          key={course.id}
          onClick={() => router.push(`/courses/${course.id}`)}
          title={course.title}
          subtitle={[
            `Lecture: ${course.lecture_hour ?? 0}h | Laboratory: ${course.laboratory_hour ?? 0}h`,
          ]}
          isSelected={selectedId === course.id}
          icon={<NotebookTabs className="h-14 w-14 text-background" />}
          annotations={
            <span className="inline-flex rounded-full bg-foreground/10 px-3 py-1 text-xs text-foreground">
              {course.code}
            </span>
          }
        />
      ))}
    </AdminListContainer>
  );
};
