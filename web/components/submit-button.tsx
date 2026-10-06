"use client";

import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";

export function SubmitButton(props: Omit<React.ComponentProps<typeof Button>, "type">) {
  const { pending } = useFormStatus();
  return <Button type="submit" disabled={pending} {...props} />;
}
