# Segurança — relatório auditoria

Resumo alinhado a `docs/RELATORIO_AUDITORIA_SEGURANCA.md`:

- **Auth desligada** (`NEXT_PUBLIC_DISABLE_AUTH` / `DISABLE_AUTH`) — apenas desenvolvimento; **nunca** produção como substituto de login.
- **Service role** Supabase — só em runtime servidor.
- **sessionStorage** (`meca_dashboard_bootstrap`, `meca_row_*`) — perfil comportamental; risco com **XSS** — CSP e sanitização.
- **RLS** no Postgres — linha de defesa com cliente anon.
- Guardas **Tailwind no cliente** — observabilidade de UI, **não** controlo de segurança.

Checklist completo no documento em `docs/`.
