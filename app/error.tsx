"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <h2 className="mb-4 text-4xl font-bold">500 - Algo deu errado!</h2>
      <p className="mb-4 text-gray-600">
        Ocorreu um erro inesperado. Por favor, tente novamente.
      </p>
      <div className="flex gap-4">
        <button
          onClick={() => reset()}
          className="rounded bg-primary px-4 py-2 text-white hover:bg-primary/90"
        >
          Tentar novamente
        </button>
        <Link href="/" className="text-primary underline hover:text-primary/90">
          Voltar para a página inicial
        </Link>
      </div>
    </div>
  );
}
