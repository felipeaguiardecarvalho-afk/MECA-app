import { Suspense } from "react";
import { AdminDiagnosticPanel } from "@/components/admin/AdminDiagnosticPanel";
/** Dashboard principal da rota — único cliente de dashboard aqui (não usar `DashboardClient` em paralelo). */
import MECADashboard from "@/components/Dashboard";

/** Client tree uses `useSearchParams` — avoid static prerender edge cases. */
export const dynamic = "force-dynamic";

export default function DashboardPage() {
  return (
    <>
      <AdminDiagnosticPanel />
      <Suspense
        fallback={
          <div className="section-meca w-full">
            <p className="container-meca text-center text-base text-gray-500 sm:text-lg">
              A carregar…
            </p>
          </div>
        }
      >
        <MECADashboard />
      </Suspense>
    </>
  );
}
