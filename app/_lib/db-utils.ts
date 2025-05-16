/* eslint-disable @typescript-eslint/no-explicit-any */

import { executeWithRetry } from "./prisma";

// Cache em memória simples
const cache = new Map<string, { data: any; expiry: number }>();

/**
 * Função para executar consultas com cache
 */
export async function queryWithCache<T>(
  cacheKey: string,
  queryFn: () => Promise<T>,
  ttlSeconds = 60,
): Promise<T> {
  // Verifica se o resultado está em cache e não expirou
  const cached = cache.get(cacheKey);
  if (cached && cached.expiry > Date.now()) {
    return cached.data as T;
  }

  // Executa a consulta com retry
  const result = await executeWithRetry(queryFn);

  // Armazena o resultado em cache
  cache.set(cacheKey, {
    data: result,
    expiry: Date.now() + ttlSeconds * 1000,
  });

  return result;
}

/**
 * Limpa o cache por prefixo
 */
export function clearCache(prefix?: string): void {
  if (prefix) {
    for (const key of cache.keys()) {
      if (key.startsWith(prefix)) {
        cache.delete(key);
      }
    }
  } else {
    cache.clear();
  }
}

/**
 * Função para executar consultas em lote
 */
export async function batchQueries<T>(
  queries: Array<() => Promise<any>>,
): Promise<T[]> {
  return Promise.all(queries.map((query) => executeWithRetry(query)));
}
