"use client";

import { AlertCircle, CheckCircle } from "lucide-react";

type SuccessContent = {
  title: string;
  message?: string;
};

type FormStatusBannerProps = {
  success?: SuccessContent;
  error?: string;
  variant?: "default" | "compact";
};

const FormStatusBanner = ({
  success,
  error,
  variant = "default",
}: FormStatusBannerProps) => {
  const isCompact = variant === "compact";
  const paddingClass = isCompact ? "p-3" : "p-4";
  const gapClass = isCompact ? "gap-2" : "gap-3";
  const iconClass = isCompact ? "w-4 h-4" : "w-5 h-5";
  const titleClass = isCompact
    ? "text-xs text-green-900"
    : "font-semibold text-green-900";
  const errorTextClass = isCompact ? "text-xs text-red-900" : "text-red-900";

  return (
    <>
      {success && (
        <div
          className={`${paddingClass} bg-green-50 border border-green-200 rounded-lg flex items-start ${gapClass}`}
        >
          <CheckCircle
            className={`${iconClass} text-green-600 shrink-0 mt-0.5`}
          />
          <div>
            <p className={titleClass}>{success.title}</p>
            {success.message && (
              <p
                className={
                  isCompact
                    ? "text-xs text-green-800"
                    : "text-sm text-green-800"
                }
              >
                {success.message}
              </p>
            )}
          </div>
        </div>
      )}

      {error && (
        <div
          className={`${paddingClass} bg-red-50 border border-red-200 rounded-lg flex items-start ${gapClass}`}
        >
          <AlertCircle
            className={`${iconClass} text-red-600 shrink-0 mt-0.5`}
          />
          <p className={errorTextClass}>{error}</p>
        </div>
      )}
    </>
  );
};

export default FormStatusBanner;
