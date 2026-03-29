"use client";

import { useEffect } from "react";

type AutoPrintTriggerProps = {
  enabled: boolean;
};

const AutoPrintTrigger = ({ enabled }: AutoPrintTriggerProps) => {
  useEffect(() => {
    if (!enabled) return;

    let closeRequested = false;
    const closeTab = () => {
      if (closeRequested) return;
      closeRequested = true;
      window.setTimeout(() => {
        window.close();
      }, 0);
    };

    const handleAfterPrint = () => {
      closeTab();
    };

    const mediaQueryList =
      typeof window.matchMedia === "function"
        ? window.matchMedia("print")
        : null;

    const handlePrintMediaChange = (event: MediaQueryListEvent) => {
      if (!event.matches) {
        closeTab();
      }
    };

    window.addEventListener("afterprint", handleAfterPrint);
    if (mediaQueryList) {
      if (typeof mediaQueryList.addEventListener === "function") {
        mediaQueryList.addEventListener("change", handlePrintMediaChange);
      }
    }

    const timer = window.setTimeout(() => {
      window.print();
    }, 300);

    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("afterprint", handleAfterPrint);
      if (mediaQueryList) {
        if (typeof mediaQueryList.removeEventListener === "function") {
          mediaQueryList.removeEventListener("change", handlePrintMediaChange);
        }
      }
    };
  }, [enabled]);

  return null;
};

export default AutoPrintTrigger;
