import { Suspense } from "react";
import { AdminDiagnosticPanel } from "@/components/admin/AdminDiagnosticPanel";
import MECADashboard from "@/components/Dashboard";

export default function DashboardPage() {
  return (
    <>
      <AdminDiagnosticPanel />
      <Suspense
        fallback={
          <p className="py-24 text-center text-lg text-gray-500">A carregar…</p>
        }
      >
        <MECADashboard />
      </Suspense>
    </>
  );
}
