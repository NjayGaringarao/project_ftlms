import { ExtendedDesignation } from "@/features/shared/types/models/designation";
import { DesignationAddForm } from "@/features/admin/components/users/designation-add-form";
import DesignationInformationContent from "@/features/shared/components/user/designation-information-content";

type DesignationItem = Omit<ExtendedDesignation, "user">;

type NewDesignationInput = {
  college_id: string | null;
  program_offering_id: string | null;
  campus_id: string | null;
  room_id: string | null;
  job_title: string;
  load: number;
  campus?: DesignationItem["campus"];
  college?: DesignationItem["college"];
  program_offering?: DesignationItem["program_offering"];
  program?: DesignationItem["program"];
};

type BaseDesignationSectionProps = {
  designations: DesignationItem[];
};

type ViewModeProps = BaseDesignationSectionProps & {
  mode: "view";
};

type EditModeProps = BaseDesignationSectionProps & {
  mode: "edit";
  onAddDesignation: (designation: NewDesignationInput) => void;
  onRemoveDesignation: (index: number) => void;
  isMutating: boolean;
  error?: string;
};

type DesignationSectionProps = ViewModeProps | EditModeProps;

const DesignationSection = (props: DesignationSectionProps) => {
  const { designations } = props;

  if (props.mode === "view") {
    return <DesignationInformationContent designations={designations} />;
  }

  return (
    <DesignationInformationContent
      designations={designations}
      onRemove={props.onRemoveDesignation}
      removeDisabled={props.isMutating}
      trailingContent={
        <DesignationAddForm
          onAdd={props.onAddDesignation}
          isLoading={props.isMutating}
          error={props.error}
        />
      }
    />
  );
};

export type { DesignationItem, NewDesignationInput };
export default DesignationSection;
