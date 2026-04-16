import { redirect } from "next/navigation";

/** Alias em português: o fluxo real do app é `/assessment`. */
export default function DiagnosticoPage() {
  redirect("/assessment");
}
