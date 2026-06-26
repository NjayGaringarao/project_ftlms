import Image from "next/image";

export const PrmsuFormHeader = ({
  documentTitle,
  subtitle,
  collegeName,
  campusName,
}: {
  documentTitle: string;
  subtitle: string;
  collegeName: string | null;
  campusName: string | null;
}) => (
  <div className="flex items-start justify-between gap-4 mb-3">
    <div className="flex-shrink-0">
      <Image
        src="/logo/prmsu.png"
        alt="PRMSU Logo"
        width={64}
        height={64}
        className="h-16 w-16 object-contain"
        unoptimized
      />
    </div>
    <div className="flex-1 text-center">
      <p className="text-[10px]">Republic of the Philippines</p>
      <p className="font-bold text-sm leading-tight">
        PRESIDENT RAMON MAGSAYSAY STATE UNIVERSITY
      </p>
      <p className="text-[10px]">
        (Formerly Ramon Magsaysay Technological University)
      </p>
      <p className="font-bold text-sm mt-1">{documentTitle}</p>
      <p className="text-[10px]">{subtitle}</p>
      {collegeName ? (
        <p className="text-xs font-semibold mt-0.5">
          COLLEGE OF {collegeName.toUpperCase().replace(/^COLLEGE OF /i, "")}
        </p>
      ) : null}
      {campusName ? <p className="text-[10px]">{campusName} Campus</p> : null}
    </div>
    <div className="flex-shrink-0">
      <Image
        src="/logo/icto.jpg"
        alt="CCIT Logo"
        width={64}
        height={64}
        className="h-16 w-16 object-contain"
        unoptimized
      />
    </div>
  </div>
);
