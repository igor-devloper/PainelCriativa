"use client";

import { useEffect } from "react";
import { Button } from "@/app/_components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/app/_components/ui/card";

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
    <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
      <Card className="mx-auto max-w-sm">
        <CardHeader>
          <CardTitle>Algo deu errado!</CardTitle>
          <CardDescription>
            Ocorreu um erro ao carregar o painel administrativo.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {error.message || "Por favor, tente novamente mais tarde."}
          </p>
        </CardContent>
        <CardFooter>
          <Button onClick={() => reset()}>Tentar Novamente</Button>
        </CardFooter>
      </Card>
    </div>
  );
}
