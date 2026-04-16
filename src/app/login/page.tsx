import { Suspense } from "react";
import { LoginForm } from "./LoginForm";

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <p className="py-24 text-center text-lg text-gray-500">A carregar…</p>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
