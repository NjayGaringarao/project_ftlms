import React from "react";
import Image from "next/image";
const UnderConstruction = () => {
  return (
    <div className="flex flex-row justify-center items-end p-12">
      <Image
        src="/under_construction.png"
        alt="Home Banner"
        width={1200}
        height={400}
        className="w-1/4"
      />
      <div className="flex flex-col">
        <h1 className="text-6xl font-semibold">Under Construction</h1>
        <p className="text-center text-foreground/80">
          This page is currently under development. Please check back later for
          updates!
        </p>
      </div>
    </div>
  );
};

export default UnderConstruction;
