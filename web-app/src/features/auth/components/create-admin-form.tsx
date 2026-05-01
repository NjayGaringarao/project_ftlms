"use client";

import { createAdmin } from "@/features/auth/lib/actions";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { cn } from "@/utils/style";

export function CreateAdminForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    if (password !== repeatPassword) {
      setError("Passwords do not match");
      setIsLoading(false);
      return;
    }

    try {
      const result = await createAdmin(email, password);
      if (result?.error) {
        setError(result.error);
      }
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="bg-transparent rounded-none flex flex-col justify-center border-none shadow-none">
        <CardHeader>
          <CardTitle className="text-2xl">Create Administrator</CardTitle>
          <CardDescription>Create an Admin Account</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreateAdmin}>
            <div className="flex flex-col gap-6">
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <div className="flex items-center">
                  <Label htmlFor="password">Password</Label>
                </div>
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <div className="flex items-center">
                  <Label htmlFor="repeat-password">Repeat Password</Label>
                </div>
                <Input
                  id="repeat-password"
                  type="password"
                  required
                  value={repeatPassword}
                  onChange={(e) => setRepeatPassword(e.target.value)}
                />
              </div>
              {error && <p className="text-sm text-red-500">{error}</p>}
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Creating an account..." : "Create Account"}
              </Button>

              <div className="text-error">
                <p className="mb-1">Important Things to Note:</p>

                <ul className="list-disc list-inside text-sm">
                  <li>
                    This action can only be performed once to create the first
                    admin account.
                  </li>

                  <li>
                    Make sure you have inputted a correct and working email
                    address.
                  </li>
                  <li className="text-red-600">
                    Email address cannot be changed until it has been verified
                    through e-mail.
                  </li>
                  <li>
                    Contact the developer in case you have accidently registered
                    wrong email address.
                  </li>
                </ul>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
