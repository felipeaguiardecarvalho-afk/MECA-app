# Operação — clean build e erros comuns

## Sintomas

- `Cannot find module './611.js'` ou chunk em falta
- `TypeError: a[d] is not a function` em `webpack-runtime.js`
- HTTP **500** em todas as rotas
- Avisos **ENOENT** em `.next/cache/webpack/.../*.pack.gz`

## Causa típica

Cache **`.next`** ou **`node_modules/.cache`** corrompido ou parcialmente apagado com **`next dev`** a correr.

## Procedimento

1. Parar o servidor (`Ctrl+C` ou matar processo na porta 3000).
2. `npm run clean`
3. `npm run dev` ou `npm run build` + `npm run start`

## Porta

- Dev padrão: **http://localhost:3000**

Ver também: [[Backups físicos na raiz]].
