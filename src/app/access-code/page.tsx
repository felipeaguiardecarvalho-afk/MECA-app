import { redirect } from "next/navigation";

/** Códigos de organização desativados — o acesso é por conta (e-mail / magic link). */
export default function AccessCodePage() {
  redirect("/dashboard");
}
