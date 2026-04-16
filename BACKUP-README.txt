================================================================================
BACKUP FÍSICO — MECA APP (RAIZ DO PROJETO)
================================================================================

Ficheiros: MECA-backup-fonte-YYYYMMDD-HHMMSS.zip

O que entra no ZIP
  - Código-fonte (src/, public/, configs, docs/, supabase/, relatórios .txt)
  - Excluído de propósito: node_modules, .next, .git, .env.local

Porque excluir .env.local
  - Contém segredos (Supabase, etc.). Não deve ser copiado para pen drives
    partilhados ou repositórios públicos.

Como restaurar
  1. Extrair o ZIP para uma pasta.
  2. npm install   (ou npm ci se usar lockfile)
  3. Copiar .env.example para .env.local e preencher variáveis.
  4. npm run dev

Gerar novo backup (PowerShell, na raiz do projeto)
  tar.exe -a -cf MECA-backup-fonte-NOME.zip ^
    --exclude=node_modules --exclude=.next --exclude=.git --exclude=.env.local ^
    --exclude=MECA-backup-fonte-*.zip .

================================================================================
