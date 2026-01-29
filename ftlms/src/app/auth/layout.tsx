import React from "react";
import Image from "next/image";
const AuthLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="h-screen w-full flex flex-row">
      <Image
        src="/prmsu_backdrop.png"
        alt="Logo"
        width={150}
        height={75}
        className="absolute h-screen w-full object-cover object-center"
      />
      <div className="relative w-full md:max-w-lg">{children}</div>
      <div className="relative flex-1 flex-col justify-between md:flex hidden ">
        <div className="absolute z-10 w-full h-screen bg-background/85 backdrop-blur-xs"></div>
        <div className="z-20 flex-1 flex flex-col items-center justify-center p-6 md:p-10">
          <Image
            src="/logo_light.png"
            alt="Logo"
            width={150}
            height={75}
            className="w-1/2"
          />
        </div>
        <div className="z-20 w-full bg-foreground p-6 md:p-10 text-center">
          <h1 className="text-4xl text-background">
            FACULTY TEACHING LOAD MANAGEMENT SYSTEM
          </h1>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
