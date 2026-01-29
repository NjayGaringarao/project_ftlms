import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";

export default function Page() {
  return (
    <Card className="bg-background/90 backdrop-blur-md md:backdrop-blur-none md:bg-background h-screen rounded-none flex flex-col justify-center md:p-6">
      <CardHeader>
        <CardTitle className="text-4xl">Nice!</CardTitle>
        <CardDescription>Check your email to confirm</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-12">
        <p className="text-sm text-muted-foreground">
          You&apos;ve successfully created admin account. You are one step away
          from implementing Faculty Teaching Load Management System.
        </p>
        <Link
          href="/auth/login"
          className=" bg-foreground text-background rounded-sm py-2 px-3 w-fit"
        >
          Continue to Login
        </Link>
      </CardContent>
    </Card>
  );
}
