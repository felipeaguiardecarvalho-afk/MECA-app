import { AssessmentClient } from "./AssessmentClient";

/**
 * E2E/UAT: com E2E_INSTANT_DIAGNOSTIC=1 o cliente submete respostas neutras (3) para todas as perguntas.
 * Usar apenas com `npm run dev:e2e` ou variável definida no servidor de teste — nunca em produção.
 */
export default function AssessmentPage() {
  const e2eInstant =
    process.env.E2E_INSTANT_DIAGNOSTIC === "1" ||
    process.env.E2E_INSTANT_DIAGNOSTIC === "true";
  return <AssessmentClient e2eInstantDiagnostic={e2eInstant} />;
}
