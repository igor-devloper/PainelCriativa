/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { db } from "@/app/_lib/prisma";

// Rota para verificar a saúde do banco de dados
export async function GET() {
  try {
    // Executa uma consulta simples para verificar a conexão
    await db.$queryRaw`SELECT 1`;

    return NextResponse.json(
      {
        status: "ok",
        timestamp: new Date().toISOString(),
        database: "connected",
      },
      { status: 200 },
    );
  } catch (error: any) {
    console.error("Erro de conexão com o banco de dados:", error);

    return NextResponse.json(
      {
        status: "error",
        message: "Falha na conexão com o banco de dados",
        error: error.message,
      },
      { status: 500 },
    );
  }
}
