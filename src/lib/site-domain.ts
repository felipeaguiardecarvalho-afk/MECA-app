/**
 * Domínio público oficial do produto (canónico).
 * Usado no middleware para redirecionar www → apex e na documentação de deploy.
 */
export const CANONICAL_SITE_HOST = "metodomeca.com.br" as const;

export function canonicalSiteOrigin(): `https://${typeof CANONICAL_SITE_HOST}` {
  return `https://${CANONICAL_SITE_HOST}`;
}
