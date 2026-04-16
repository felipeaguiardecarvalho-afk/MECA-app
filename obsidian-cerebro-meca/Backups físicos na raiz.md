# Backups físicos na raiz

## Ficheiro ZIP

- Na raiz do projeto existem ficheiros nomeados **`MECA-backup-fonte-YYYYMMDD-HHMMSS.zip`**.

## Conteúdo típico

- Código-fonte (`src/`, `public/`, configs)
- `docs/`, `supabase/`, relatórios `.txt`
- **Excluído:** `node_modules/`, `.next/`, `.git/`, **`.env.local`** (segredos locais não devem ir para arquivo partilhado)

## Restaurar

1. Extrair o ZIP para uma pasta nova.
2. `npm ci` ou `npm install`
3. Copiar `.env.example` → `.env.local` e preencher segredos.
4. `npm run dev` ou `npm run build`

## Segurança

- Não commitar `.env.local`.
- Se um backup antigo incluir `.env.local`, tratar como **confidencial** ou apagar.

---

Ver também: [[Operação — clean build e erros comuns]].
