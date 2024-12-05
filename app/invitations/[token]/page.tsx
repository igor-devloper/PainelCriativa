"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";

export default function InvitationPage({
  params,
}: {
  params: { token: string };
}) {
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading",
  );
  const [errorMessage, setErrorMessage] = useState("");
  const router = useRouter();
  const { isLoaded, isSignedIn } = useAuth();

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push(
        `/sign-in?redirect_url=${encodeURIComponent(`/invitations/${params.token}`)}`,
      );
      return;
    }

    if (isLoaded && isSignedIn) {
      fetch(`/api/invitations/${params.token}`)
        .then(async (response) => {
          if (response.ok) {
            setStatus("success");
            // Aguardar um pouco antes de redirecionar para a página da equipe
            setTimeout(() => {
              router.push("/teams");
            }, 3000);
          } else {
            const data = await response.json();
            setStatus("error");
            setErrorMessage(
              data.error || "Ocorreu um erro ao processar o convite.",
            );
          }
        })
        .catch((error) => {
          console.error("Error:", error);
          setStatus("error");
          setErrorMessage("Ocorreu um erro ao processar o convite.");
        });
    }
  }, [isLoaded, isSignedIn, params.token, router]);

  if (status === "loading") {
    return <div>Processando convite...</div>;
  }

  if (status === "success") {
    return (
      <div>
        Convite aceito com sucesso! Redirecionando para a página da equipe...
      </div>
    );
  }

  if (status === "error") {
    return <div>Erro: {errorMessage}</div>;
  }

  return null;
}
