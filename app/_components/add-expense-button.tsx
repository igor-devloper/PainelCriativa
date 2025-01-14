"use client";

import { ArrowDownUpIcon, Loader2 } from "lucide-react";
import { Button } from "./ui/button";
import { useState } from "react";
import { UpsertExpenseDialog } from "./upsert-expense-dialog";
import { AccountingBlock } from "@/app/types";

interface AddExpenseButtonProps {
  blockId: string;
  block: AccountingBlock;
}

export function AddExpenseButton({ blockId, block }: AddExpenseButtonProps) {
  const [dialogIsOpen, setDialogIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  return (
    <>
      <Button
        className="h-9 rounded-full px-3 md:rounded-full md:font-bold"
        onClick={() => setDialogIsOpen(true)}
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
      <UpsertExpenseDialog
        isOpen={dialogIsOpen}
        setIsOpen={setDialogIsOpen}
        onLoadingChange={setIsLoading}
        blockId={blockId}
        block={block}
      />
    </>
  );
}
