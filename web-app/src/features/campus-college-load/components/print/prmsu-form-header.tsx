import Image from "next/image";

export const PrmsuFormHeader = ({
  documentTitle,
  subtitle,
  collegeName,
  campusName,
  collegeLogoUrl,
}: {
  documentTitle: string;
  subtitle: string;
  collegeName: string | null;
  campusName: string | null;
  collegeLogoUrl?: string | null;
}) => (
  <div
    className="w-full flex flex-col items-center"
    style={{ fontFamily: "'Times New Roman', Times, serif" }}
  >
    <div className="flex items-start justify-between gap-4 mb-3">
      <div className="shrink-0">
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
        <p className="text-[11px]">Republic of the Philippines</p>
        <p
          className="font-bold text-[16px] leading-tight"
          style={{
            fontFamily: "'Old English Text MT', UnifrakturMaguntia, serif",
          }}
        >
          President Ramon Magsaysay State University
        </p>
        <p className="text-[10px] italic">
          (Formerly Ramon Magsaysay Technological University)
        </p>
        <p className="font-bold text-[12px] mt-1">{documentTitle}</p>
        <p className="text-[11px]">{subtitle}</p>
        {collegeName ? (
          <p className="text-[11px] font-semibold mt-0.5">
            COLLEGE OF {collegeName.toUpperCase().replace(/^COLLEGE OF /i, "")}
          </p>
        ) : null}
        {campusName ? <p className="text-[11px]">{campusName} Campus</p> : null}
      </div>
      {collegeLogoUrl ? (
        <div className="shrink-0">
          <img
            src={collegeLogoUrl}
            alt="College Logo"
            width={64}
            height={64}
            className="h-16 w-16 object-contain"
          />
        </div>
      ) : null}
    </div>
  </div>
);
