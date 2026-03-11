import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";

export type DegreeRow = {
  id?: string;
  tempId: string;
  academicLevel: string;
  title: string;
  institution: string;
  countryCode: string;
  yearGraduated: string;
};

type DegreeItemProps = {
  row: DegreeRow;
  index: number;
  isSaving: boolean;
  onRemove: (tempId: string) => void;
  onChange: (tempId: string, field: keyof DegreeRow, value: string) => void;
};

const DegreeItem = ({
  row,
  index,
  isSaving,
  onRemove,
  onChange,
}: DegreeItemProps) => {
  const currentYear = new Date().getFullYear();

  return (
    <div className="border border-border rounded-lg p-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-foreground/60">Degree {index + 1}</p>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onRemove(row.tempId)}
          disabled={isSaving}
        >
          <Trash2 className="w-4 h-4 mr-1" />
          Remove
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor={`degree-level-${row.tempId}`}>Level</Label>
          <Select
            id={`degree-level-${row.tempId}`}
            value={row.academicLevel}
            onChange={(event) =>
              onChange(row.tempId, "academicLevel", event.target.value)
            }
            className="mt-1"
            disabled={isSaving}
          >
            <option value="Bachelor&apos;s Degree">Bachelor&apos;s Degree</option>
            <option value="Master&apos;s Degree">Master&apos;s Degree</option>
            <option value="Doctorate Degree">Doctorate Degree</option>
          </Select>
        </div>

        <div className="col-span-2">
          <Label htmlFor={`degree-title-${row.tempId}`}>Title</Label>
          <Input
            id={`degree-title-${row.tempId}`}
            placeholder="e.g. BS Computer Science"
            value={row.title}
            onChange={(event) =>
              onChange(row.tempId, "title", event.target.value)
            }
            className="mt-1"
            disabled={isSaving}
          />
        </div>

        <div className="col-span-2">
          <Label htmlFor={`degree-institution-${row.tempId}`}>
            Institution
          </Label>
          <Input
            id={`degree-institution-${row.tempId}`}
            placeholder="e.g. President Ramon Magsaysay State University"
            value={row.institution}
            onChange={(event) =>
              onChange(row.tempId, "institution", event.target.value)
            }
            className="mt-1"
            disabled={isSaving}
          />
        </div>

        <div>
          <Label htmlFor={`degree-country-${row.tempId}`}>Country Code</Label>
          <Input
            id={`degree-country-${row.tempId}`}
            placeholder="e.g. PH"
            value={row.countryCode}
            onChange={(event) =>
              onChange(
                row.tempId,
                "countryCode",
                event.target.value.toUpperCase(),
              )
            }
            className="mt-1"
            maxLength={2}
            disabled={isSaving}
          />
        </div>

        <div>
          <Label htmlFor={`degree-year-${row.tempId}`}>Year Graduated</Label>
          <Input
            id={`degree-year-${row.tempId}`}
            type="number"
            min={1900}
            max={currentYear}
            placeholder="e.g. 2022"
            value={row.yearGraduated}
            onChange={(event) =>
              onChange(row.tempId, "yearGraduated", event.target.value)
            }
            className="mt-1"
            disabled={isSaving}
          />
        </div>
      </div>
    </div>
  );
};

export default DegreeItem;
