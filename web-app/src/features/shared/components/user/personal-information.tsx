import FieldView from "@/components/ui/field-view";
import { Identity } from "@/features/shared/types/models/identity";
import { formatDate } from "@/utils/time";
import { formatFullName } from "@/features/shared/lib/format-name";

type PersonalInformationProps = {
  identity: Identity | null;
};

const PersonalInformation = ({ identity }: PersonalInformationProps) => {
  const displayName = formatFullName(identity) || "No name set";
  const birthDate = identity?.birth_date
    ? formatDate(identity.birth_date)
    : "Not set";
  const contactNumber = identity?.contact_number?.trim() || "Not set";
  const address = identity?.address?.trim() || "Not set";

  return (
    <section className="space-y-4">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-foreground/70">
        Personal Information
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FieldView label="Full Name" value={displayName} />
        <FieldView label="Contact Number" value={contactNumber} />
        <FieldView label="Birth Date" value={birthDate} />
        <FieldView label="Address" value={address} />
      </div>
    </section>
  );
};

export default PersonalInformation;
