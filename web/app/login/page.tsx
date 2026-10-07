import { Brand } from "@/components/brand";
import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <main className="mx-auto flex w-full max-w-xs flex-1 flex-col justify-center gap-6 p-6">
      <div className="flex flex-col items-center gap-4 text-center">
        <Brand />
        <h1 className="text-3xl leading-tight font-bold tracking-tight">
          Welcome <span className="text-gradient">back</span>
        </h1>
      </div>
      <div className="card-surface p-6">
        <LoginForm />
      </div>
    </main>
  );
}
