/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useState } from "react";
import { closeAccountingBlock } from "@/app/_lib/actions/balance";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export function useCloseBlock() {
  const [isPending, setIsPending] = useState(false);
  const router = useRouter();

  const closeBlock = async (blockId: string, remainingBalance: number) => {
    try {
      setIsPending(true);
      const result = await closeAccountingBlock(blockId);

      if (result.remainingBalance > 0) {
        toast.success(
          `Prestação fechada com sucesso! Um saldo de ${new Intl.NumberFormat(
            "pt-BR",
            {
              style: "currency",
              currency: "BRL",
            },
          ).format(result.remainingBalance)} foi adicionado à sua conta.`,
        );
      } else if (result.remainingBalance < 0) {
        toast.success(
          `Prestação fechada com sucesso! Um saldo negativo de ${new Intl.NumberFormat(
            "pt-BR",
            {
              style: "currency",
              currency: "BRL",
            },
          ).format(
            Math.abs(result.remainingBalance),
          )} foi registrado em sua conta.`,
        );
      } else {
        toast.success("Prestação fechada com sucesso!");
      }

      router.refresh();
    } catch (error) {
      toast.error("Erro ao fechar prestação de contas");
      console.error(error);
    } finally {
      setIsPending(false);
    }
  };

  return { closeBlock, isPending };
}
