import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export type CurriculumFormState = {
  major_id: string;
  title: string;
  series_year: string;
  revised_year: string;
};

type MajorOption = {
  id: string;
  code: string;
  name: string;
  program?: {
    code: string;
    name: string;
  } | null;
};

type CurriculumInitialFormProps = {
  formData: CurriculumFormState;
  onChange: (field: keyof CurriculumFormState, value: string) => void;
  onReset: () => void;
  onSubmit: () => void;
  isSaving?: boolean;
  submitLabel: string;
  submitLoadingLabel: string;
  majorOptions: MajorOption[];
};

export const CurriculumInitialForm = ({
  formData,
  onChange,
  onReset,
  onSubmit,
  isSaving = false,
  submitLabel,
  submitLoadingLabel,
  majorOptions,
}: CurriculumInitialFormProps) => {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <Label className="text-xs" htmlFor="curriculum-major-id">
            Major *
          </Label>
          <select
            id="curriculum-major-id"
            className="w-full mt-1 px-3 py-2 border border-input rounded-md bg-background text-foreground text-sm"
            value={formData.major_id}
            onChange={(event) => onChange("major_id", event.target.value)}
            disabled={isSaving}
          >
            <option value="">Select major...</option>
            {majorOptions.map((major) => (
              <option key={major.id} value={major.id}>
                {major.program?.code ? `${major.program.code} - ` : ""}
                {major.name} ({major.code})
              </option>
            ))}
          </select>
        </div>

        <div className="md:col-span-2">
          <Label className="text-xs" htmlFor="curriculum-title">
            Title *
          </Label>
          <Input
            id="curriculum-title"
            value={formData.title}
            onChange={(event) => onChange("title", event.target.value)}
            onBlur={(event) => onChange("title", event.target.value.trim())}
            className="mt-1"
            disabled={isSaving}
          />
        </div>

        <div>
          <Label className="text-xs" htmlFor="curriculum-series-year">
            Series Year *
          </Label>
          <Input
            id="curriculum-series-year"
            type="number"
            min="1900"
            value={formData.series_year}
            onChange={(event) => onChange("series_year", event.target.value)}
            className="mt-1"
            disabled={isSaving}
          />
        </div>

        <div>
          <Label className="text-xs" htmlFor="curriculum-revised-year">
            Revised Year
          </Label>
          <Input
            id="curriculum-revised-year"
            type="number"
            min="1900"
            value={formData.revised_year}
            onChange={(event) => onChange("revised_year", event.target.value)}
            className="mt-1"
            disabled={isSaving}
          />
        </div>
      </div>

      <div className="flex gap-2 justify-end pt-4 border-t">
        <Button variant="outline" onClick={onReset} disabled={isSaving}>
          Reset
        </Button>
        <Button onClick={onSubmit} disabled={isSaving}>
          {isSaving ? submitLoadingLabel : submitLabel}
        </Button>
      </div>
    </div>
  );
};
