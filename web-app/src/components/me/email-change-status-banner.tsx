"use client";

import { useEffect, useState } from "react";
import { AlertCircle, CheckCircle } from "lucide-react";

interface EmailChangeStatusBannerProps {
  initialStatus?: string;
  initialMessage?: string;
  initialConfirmedEmail?: string;
}

const parseHashParams = () => {
  if (typeof window === "undefined") {
    return {} as {
      status?: string;
      message?: string;
      confirmedEmail?: string;
    };
  }

  const rawHash = window.location.hash?.startsWith("#")
    ? window.location.hash.slice(1)
    : "";

  if (!rawHash) {
    return {};
  }

  const params = new URLSearchParams(rawHash);
  const error = params.get("error") || params.get("error_code");
  const errorDescription = params.get("error_description");
  const message = params.get("message");
  const confirmedEmail = params.get("confirmed_email");

  if (error || errorDescription) {
    return {
      status: "error",
      message: errorDescription || message || error || undefined,
      confirmedEmail: confirmedEmail || undefined,
    };
  }

  return {
    status:
      params.get("email_change_status") || (message ? "success" : undefined),
    message: message || undefined,
    confirmedEmail: confirmedEmail || undefined,
  };
};

const EmailChangeStatusBanner = ({
  initialStatus,
  initialMessage,
  initialConfirmedEmail,
}: EmailChangeStatusBannerProps) => {
  const [status, setStatus] = useState<string | undefined>(initialStatus);
  const [message, setMessage] = useState<string | undefined>(initialMessage);
  const [confirmedEmail, setConfirmedEmail] = useState<string | undefined>(
    initialConfirmedEmail,
  );

  useEffect(() => {
    const hashData = parseHashParams();

    const timer = setTimeout(() => {
      if (hashData.status) {
        setStatus(hashData.status);
      } else if (!initialStatus && hashData.message) {
        setStatus("success");
      }
      if (hashData.message) {
        setMessage(hashData.message);
      }
      if (hashData.confirmedEmail) {
        setConfirmedEmail(hashData.confirmedEmail);
      }
    }, 0);

    if (typeof window === "undefined") {
      return;
    }

    const url = new URL(window.location.href);
    const keysToClear = [
      "email_change_status",
      "message",
      "confirmed_email",
      "error",
      "error_code",
      "error_description",
    ];

    let shouldReplace = false;
    for (const key of keysToClear) {
      if (url.searchParams.has(key)) {
        url.searchParams.delete(key);
        shouldReplace = true;
      }
    }

    if (url.hash) {
      url.hash = "";
      shouldReplace = true;
    }

    if (shouldReplace) {
      const next = `${url.pathname}${url.search}${url.hash}`;
      window.history.replaceState({}, "", next || url.pathname);
    }
    return () => clearTimeout(timer);
  }, [initialStatus]);

  const showBanner = status === "success" || status === "error";
  if (!showBanner) {
    return null;
  }

  const isSuccess = status === "success";
  const bannerMessage =
    message ||
    (isSuccess
      ? confirmedEmail
        ? `Email change confirmed for ${confirmedEmail}.`
        : "Email change confirmed."
      : "Email change confirmation failed.");

  return (
    <div
      className={`p-4 rounded-lg border flex items-start gap-3 ${
        isSuccess
          ? "bg-green-50 border-green-200 text-green-900"
          : "bg-red-50 border-red-200 text-red-900"
      }`}
    >
      {isSuccess ? (
        <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
      ) : (
        <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
      )}
      <div>
        <p className="font-semibold">
          {isSuccess ? "Email Change Successful" : "Email Change Failed"}
        </p>
        <p className="text-sm">{bannerMessage}</p>
      </div>
    </div>
  );
};

export default EmailChangeStatusBanner;
