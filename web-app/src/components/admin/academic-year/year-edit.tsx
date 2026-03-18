"use client";

import { useRouter } from "next/navigation";
import { Edit } from "lucide-react";
import { AcademicYear } from "@/models/academic_year";
import { TermListItem } from "@/lib/admin/terms";
import { TermsListEdit } from "./terms-list-edit";
import AdminPanel from "../admin-panel";
import { YearInitialForm } from "./year-initial-form";

type YearEditProps = {
  year: AcademicYear;
  terms: TermListItem[];
};

export const YearEdit = ({ year, terms }: YearEditProps) => {
  const router = useRouter();

  const formData = {
    start_year: String(year.start_year),
    end_year: String(year.end_year),
  };

  return (
    <AdminPanel
      title="Edit Academic Year"
      icon={Edit}
      onClose={() => router.push(`/academic-years/${year.id}`)}
    >
      <div className="space-y-4">
        <YearInitialForm
          formData={formData}
          onChange={() => {}}
          onReset={() => {}}
          onSubmit={() => {}}
          isSaving={false}
          submitLabel=""
          submitLoadingLabel=""
          isReadOnly
          hideActions
        />

        <TermsListEdit
          year={year}
          terms={terms}
          onTermsChange={() => router.refresh()}
        />
      </div>
    </AdminPanel>
  );
};
