/* eslint-disable @typescript-eslint/no-explicit-any */
import { PrismaClient } from "@prisma/client";

// Tipos para o objeto global
declare global {
  // eslint-disable-next-line no-var
  var cachedPrisma: PrismaClient;
}

// Configurações do Prisma Client sem usar $extends
const prismaClientSingleton = () => {
  const prisma = new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

  // Adiciona middleware para monitorar consultas
  prisma.$use(async (params, next) => {
    const start = performance.now();

    try {
      const result = await next(params);
      const end = performance.now();

      // Log de consultas lentas (mais de 100ms)
      if (end - start > 100) {
        console.log(
          `Consulta lenta (${Math.round(end - start)}ms): ${params.model}.${params.action}`,
        );
      }

      return result;
    } catch (error: any) {
      // Verifica se é um erro de conexão
      if (
        error.message.includes("Connection closed") ||
        error.message.includes("Connection terminated") ||
        error.code === "P2023" || // Inconsistent query
        error.code === "P2024" || // Connection pool timeout
        error.code === "P2025" // Record not found
      ) {
        console.warn(
          `Erro de conexão em ${params.model}.${params.action}. Tentando novamente...`,
        );

        // Espera um pouco antes de tentar novamente
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // Não tenta novamente aqui, deixa para a função executeWithRetry
        throw error;
      }

      // Se não for erro de conexão, propaga o erro
      throw error;
    }
  });

  return prisma;
};

// Exporta o cliente Prisma como singleton
let prisma: PrismaClient;

if (process.env.NODE_ENV === "production") {
  prisma = prismaClientSingleton();
} else {
  if (!global.cachedPrisma) {
    global.cachedPrisma = prismaClientSingleton();
  }
  prisma = global.cachedPrisma;
}

// Função para executar consultas com retry automático
export async function executeWithRetry<T>(
  operation: () => Promise<T>,
  maxRetries = 3,
  delay = 1000,
): Promise<T> {
  let lastError: any;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error: any) {
      lastError = error;

      // Verifica se é um erro de conexão fechada
      const isConnectionError =
        error.message.includes("Connection closed") ||
        error.message.includes("Connection terminated") ||
        error.code === "P2023" || // Prisma: Inconsistent query
        error.code === "P2024" || // Prisma: Connection pool timeout
        error.code === "P2025"; // Prisma: Record not found

      if (!isConnectionError || attempt === maxRetries) {
        throw error;
      }

      console.warn(
        `Tentativa ${attempt} falhou, tentando novamente em ${delay}ms...`,
      );
      await new Promise((resolve) => setTimeout(resolve, delay));

      // Aumenta o delay exponencialmente para cada nova tentativa
      delay *= 2;
    }
  }

  throw lastError;
}

export { prisma };
export const db = prisma;
