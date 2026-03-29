"use client";

import { useEffect } from "react";

type AutoPrintTriggerProps = {
  enabled: boolean;
};

const AutoPrintTrigger = ({ enabled }: AutoPrintTriggerProps) => {
  useEffect(() => {
    if (!enabled) return;

    const timer = window.setTimeout(() => {
      window.print();
    }, 300);

    return () => {
      window.clearTimeout(timer);
    };
  }, [enabled]);

  return null;
};

export default AutoPrintTrigger;
