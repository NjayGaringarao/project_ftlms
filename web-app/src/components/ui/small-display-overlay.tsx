import React from "react";
import Image from "next/image";

const SmallDisplayOverlay = () => {
  return (
    <div className="flex flex-col gap-10 justify-center items-center min-h-screen">
      <Image
      src="/images/display_small.png"
      alt="Home Banner"
      width={400}
      height={400}
      className="w-full max-w-md sm:max-w-lg md:max-w-2xl"
      />
      <div className="flex flex-col max-w-md sm:max-w-lg text-start">
      <h1 className="text-3xl sm:text-4xl md:text-5xl font-semibold">Small Screen</h1>
      <p className="text-sm sm:text-base text-foreground/80 mt-2">
        This page requires a larger display. Please resize your browser window
        or access it on a device with a larger screen.
      </p>
      </div>
    </div>
  );
};

export default SmallDisplayOverlay;
