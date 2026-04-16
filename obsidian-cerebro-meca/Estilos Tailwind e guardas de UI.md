# Estilos Tailwind e guardas de UI

## Pipeline

- `src/app/globals.css` — `@tailwind base|components|utilities` + `@layer components` com **`ds-*`** (ex. `ds-btn-primary`, `ds-page`).
- `tailwind.config.ts` — `content`: `./src/app`, `./src/components`, `./src/lib`
- `postcss.config.js` — `tailwindcss`, `autoprefixer`
- `src/app/layout.tsx` — `import './globals.css'`, fonte Inter

## Guardas (cliente)

- `StyleGuard.tsx` — verifica utilitário `hidden` (consola se falhar).
- `TailwindFallbackBoundary.tsx` + `src/lib/tailwind-health.ts` — se Tailwind não aplicar estilos críticos, envolve em **`UiFallback`** (inline mínimo).
- Teste: `src/__tests__/styling-system.test.ts`

> Isto é **fiabilidade de UI**, não substitui segurança de rede ou auth.

## Comentários “CRITICAL”

- `layout.tsx`, `globals.css`, `tailwind.config.ts` — avisos no topo para não quebrar a pipeline CSS.
