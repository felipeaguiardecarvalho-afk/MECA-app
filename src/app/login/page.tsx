import { Suspense } from "react";
import { LoginForm } from "./LoginForm";

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="section-meca text-center text-base text-gray-500 sm:text-lg">
          <div className="container-meca">A carregar…</div>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
