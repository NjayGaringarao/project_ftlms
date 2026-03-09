import React from "react";

type FieldViewProps = {
  label: string;
  value: string;
};

const FieldView = ({ label, value }: FieldViewProps) => {
  return (
    <div className="space-y-1">
      <p className="text-xs uppercase tracking-wide text-foreground/60">
        {label}
      </p>
      <p className="text-sm font-medium wrap-break-word">{value}</p>
    </div>
  );
};

export default FieldView;
