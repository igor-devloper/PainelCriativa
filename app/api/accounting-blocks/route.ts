import { NextResponse } from "next/server";
import { getAccountingBlocks } from "@/app/_actions/get-accounting-blocks";
import { AuthError, DatabaseError } from "@/app/_lib/errors";

export async function GET() {
  try {
    const blocks = await getAccountingBlocks();
    return NextResponse.json(blocks);
  } catch (error) {
    console.error("API error:", error);

    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    if (error instanceof DatabaseError) {
      return NextResponse.json({ error: error.message }, { status: 503 });
    }

    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 },
    );
  }
}
