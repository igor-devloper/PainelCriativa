"use client";

import { useEffect } from "react";
import { Button } from "@/app/_components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4">
      <h2 className="text-2xl font-bold">Algo deu errado!</h2>
      <p className="text-muted-foreground">
        Ocorreu um erro inesperado. Por favor, tente novamente.
      </p>
      <div className="flex gap-4">
        <Button onClick={reset} variant="default">
          Tentar novamente
        </Button>
        <Button onClick={() => (window.location.href = "/")} variant="outline">
          Voltar para a página inicial
        </Button>
      </div>
    </div>
  );
}
