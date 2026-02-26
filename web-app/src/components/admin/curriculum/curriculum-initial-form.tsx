import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export type CurriculumFormState = {
  title: string;
  series_year: string;
  revised_year: string;
};

type CurriculumInitialFormProps = {
  formData: CurriculumFormState;
  onChange: (field: keyof CurriculumFormState, value: string) => void;
  onReset: () => void;
  onSubmit: () => void;
  isSaving?: boolean;
  submitLabel: string;
  submitLoadingLabel: string;
};

export const CurriculumInitialForm = ({
  formData,
  onChange,
  onReset,
  onSubmit,
  isSaving = false,
  submitLabel,
  submitLoadingLabel,
}: CurriculumInitialFormProps) => {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
