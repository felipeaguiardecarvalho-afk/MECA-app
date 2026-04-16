import { Suspense } from "react";
import { PlanoDeAcaoClient } from "./PlanoDeAcaoClient";

export default function PlanoDeAcaoPage() {
  return (
    <Suspense
      fallback={
        <p className="py-24 text-center text-lg text-gray-500">A carregar…</p>
      }
    >
      <PlanoDeAcaoClient />
    </Suspense>
  );
}
