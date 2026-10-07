"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { login } from "./actions";

export function LoginForm() {
  const [error, action, pending] = useActionState(login, null);

  return (
    <form action={action} className="flex flex-col gap-3">
      <Label htmlFor="password">Password</Label>
      <Input id="password" name="password" type="password" autoFocus required className="h-10 rounded-xl px-3.5" />
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" disabled={pending} className="mt-1 h-10 rounded-full">
        {pending ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  );
}
