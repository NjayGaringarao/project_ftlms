"use client";

import { createClient } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export function LogoutButton() {
  const router = useRouter();

  const logout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/auth/login");
  };

  return (
    <Button
      className="bg-transparent text-foreground text-base py-2 px-4 font-normal hover:bg-foreground/5 w-full rounded-none flex flex-row items-center justify-start"
      onClick={logout}
    >
      Logout
    </Button>
  );
}
