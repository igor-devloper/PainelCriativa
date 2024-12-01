"use client";

import { ArrowDownUpIcon } from "lucide-react";
import { Button } from "./ui/button";
import { useState } from "react";
import UpsertTransactionDialog from "./upsert-transaction-dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";

interface AddTransactionButtonProps {
  isAdmin?: boolean;
}

export function AddTransactionButton({ isAdmin }: AddTransactionButtonProps) {
  const [dialogIsOpen, setDialogIsOpen] = useState(false);

  const handleClick = () => {
    setDialogIsOpen(true);
  };

  return (
    <>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              className="h-9 rounded-full px-3 md:rounded-full md:font-bold"
              onClick={handleClick}
            >
              Adicionar transação
              <ArrowDownUpIcon />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            Adicione prestações de contas e controle seus gastos
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <UpsertTransactionDialog
        isAdmin={isAdmin ?? false}
        isOpen={dialogIsOpen}
        setIsOpen={setDialogIsOpen}
      />
    </>
  );
}
