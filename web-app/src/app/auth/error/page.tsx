import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/utils/style";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const params = await searchParams;
  const errorTitle = params?.error || "Sorry, something went wrong";
  const errorMessage =
    params?.message || "An unexpected error occurred. Please try again.";

  return (
    <div className={cn("flex flex-col gap-6")}>
      <Card className="bg-transparent rounded-none flex flex-col justify-center border-none shadow-none">
        <CardHeader>
          <CardTitle className="text-2xl">{errorTitle}</CardTitle>
          <CardDescription>{errorMessage}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <Button asChild>
            <Link href="/auth/login">Back to Login</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/auth/forgot-password">Request Password Reset</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
