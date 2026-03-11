import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { ACADEMIC_TERM_NAMES } from "@/lib/admin/academic-terms";

export type TermRow = {
  id?: string;
  tempId: string;
  name: string;
  start: string;
  end: string;
};

type TermEditItemProps = {
  row: TermRow;
  index: number;
  isSaving: boolean;
  onRemove: (tempId: string) => void;
  onChange: (tempId: string, field: keyof TermRow, value: string) => void;
};

const TermEditItem = ({
  row,
  index,
  isSaving,
  onRemove,
  onChange,
}: TermEditItemProps) => {
  return (
    <div className="border border-border rounded-lg p-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-foreground/60">Term {index + 1}</p>
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

      <div>
        <Label htmlFor={`term-name-${row.tempId}`}>Name</Label>
        <Select
          id={`term-name-${row.tempId}`}
          value={row.name}
          onChange={(e) => onChange(row.tempId, "name", e.target.value)}
          className="mt-1"
          disabled={isSaving}
        >
          <option value="">Select term name...</option>
          {ACADEMIC_TERM_NAMES.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor={`term-start-${row.tempId}`}>Start Date</Label>
          <Input
            id={`term-start-${row.tempId}`}
            type="date"
            value={row.start}
            onChange={(e) => onChange(row.tempId, "start", e.target.value)}
            className="mt-1"
            disabled={isSaving}
          />
        </div>
        <div>
          <Label htmlFor={`term-end-${row.tempId}`}>End Date</Label>
          <Input
            id={`term-end-${row.tempId}`}
            type="date"
            value={row.end}
            onChange={(e) => onChange(row.tempId, "end", e.target.value)}
            className="mt-1"
            disabled={isSaving}
          />
        </div>
      </div>
    </div>
  );
};

export default TermEditItem;
