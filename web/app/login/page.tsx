import { Crosshair } from "lucide-react";
import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <main className="mx-auto flex w-full max-w-xs flex-1 flex-col justify-center gap-6 p-6">
      <div className="flex items-center gap-2">
        <span className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-[var(--shadow-card)]">
          <Crosshair className="size-4" strokeWidth={2.25} />
        </span>
        <span className="text-[15px] font-semibold tracking-tight">
          JobHunter
        </span>
      </div>
      <div className="card-surface p-5">
        <LoginForm />
      </div>
    </main>
  );
}
