/**
 * Atribuição discreta — cabeçalho e rodapé em todas as páginas.
 */
export function MecaAttribution({ className = "" }: { className?: string }) {
  return (
    <p
      className={`text-[11px] font-medium leading-snug tracking-wide text-slate-400 antialiased sm:text-xs ${className}`.trim()}
    >
      MECA por Felipe A. de Carvalho
    </p>
  );
}
