"use client";
export const revalidate = 0;
export const dynamic = "force-dynamic";
import { ArrowDownUpIcon, Loader2 } from "lucide-react";
import { Button } from "./ui/button";
import { useState } from "react";
import UpsertTransactionDialog from "./upsert-transaction-dialog";

interface AddTransactionButtonProps {
  isAdmin?: boolean;
  balance?: number;
  blockId?: string;
  teamId?: string;
}

export function AddTransactionButton({
  isAdmin,
  balance,
  blockId,
  teamId,
}: AddTransactionButtonProps) {
  const [dialogIsOpen, setDialogIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = () => {
    setDialogIsOpen(true);
  };

  return (
    <>
      <Button
        className="h-9 rounded-full px-3 md:rounded-full md:font-bold"
        onClick={handleClick}
        disabled={isLoading}
        aria-label="Adicionar transação"
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <>
            Adicionar transação
            <ArrowDownUpIcon className="ml-2 h-4 w-4" />
          </>
        )}
      </Button>
      <UpsertTransactionDialog
        balance={balance}
        isAdmin={isAdmin ?? false}
        isOpen={dialogIsOpen}
        setIsOpen={setDialogIsOpen}
        onLoadingChange={setIsLoading}
        blockId={blockId ?? ""}
        teamId={teamId ?? ""}
      />
    </>
  );
}
