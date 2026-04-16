import { Suspense } from "react";
import { AccessForm } from "./AccessForm";

export default function AccessCodePage() {
  return (
    <Suspense
      fallback={
        <p className="py-24 text-center text-lg text-gray-500">A carregar…</p>
      }
    >
      <AccessForm />
    </Suspense>
  );
}
