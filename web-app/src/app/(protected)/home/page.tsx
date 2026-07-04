import UnderConstruction from "@/components/ui/under-construction";
import Image from "next/image";
const HomePage = () => {
  return (
    <div className="h-full">
      <div className="w-full bg-foreground p-11 flex flex-row justify-between items-center">
        <div>
          <h1 className="text-3xl text-background">
            Welcome to Project S+FTLMS
          </h1>
          <h2 className="text-background">
            President Ramon Magsaysay State University
          </h2>
        </div>
        <div className="flex flex-row items-center gap-4">
          <Image
            src="/prmsu.png"
            alt="Logo"
            width={50}
            height={50}
            className="w-16 h-16"
          />
          <Image
            src="/icto.jpg"
            alt="Logo"
            width={50}
            height={50}
            className="w-13 h-13"
          />
        </div>
      </div>
      <UnderConstruction />
    </div>
  );
};

export default HomePage;
