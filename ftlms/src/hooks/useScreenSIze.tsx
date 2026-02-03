import { useEffect, useState } from "react";

type ScreenSize = "small" | "medium" | "large" | "extralarge";

function getScreenSize(width: number): ScreenSize {
  if (width < 640) return "small"; // < sm
  if (width >= 640 && width < 768) return "medium"; // >= sm and < md
  if (width >= 768 && width < 1024) return "large"; // >= md and < lg
  return "extralarge"; // >= lg
}

export function useScreenSize(): ScreenSize {
  const [screenSize, setScreenSize] = useState<ScreenSize>("small");

  useEffect(() => {
    if (typeof window !== "undefined" && window.innerWidth) {
      const handleResize = () => {
        setScreenSize(getScreenSize(window.innerWidth));
      };
      // Set initial screen size
      handleResize();
      window.addEventListener("resize", handleResize);

      return () => window.removeEventListener("resize", handleResize);
    }
  }, []);

  return screenSize;
}
