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
    <Card className="bg-transparent rounded-none flex flex-col justify-center border-none shadow-none">
      <CardHeader>
        <CardTitle className="text-4xl">Nice!</CardTitle>
        <CardDescription>Check your email to confirm</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-12">
        <p className="text-sm text-muted-foreground">
          You&apos;ve successfully created an admin account. You are one step
          away from using Faculty Teaching Load Management System.
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
