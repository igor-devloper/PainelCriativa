"use client";

import { Button } from "@/app/_components/ui/button";
import { Transaction, TransactionStatus } from "@prisma/client";
import { PencilIcon } from "lucide-react";
import { useState } from "react";
import UpsertTransactionAdminDialog from "./updated-transaction-button";

interface EditTransactionButtonProps {
  transaction: Transaction;
}

const UpdateTransactionAdmin = ({
  transaction,
}: EditTransactionButtonProps) => {
  const [dialogIsOpen, setDialogIsOpen] = useState(false);

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="w-full text-muted-foreground"
        onClick={() => setDialogIsOpen(true)}
      >
        <PencilIcon />
        Atualizar
      </Button>
      <UpsertTransactionAdminDialog
        isOpen={dialogIsOpen}
        setIsOpen={setDialogIsOpen}
        transactionId={transaction.id}
        defaultValues={{
          userId: transaction.userId,
          amount: Number(transaction.amount),
          category: transaction.category,
          date: new Date(transaction.date),
          description: transaction.description ?? "",
          name: transaction.name,
          paymentMethod: transaction.paymentMethod,
          type: transaction.type,
          imageUrl: transaction.imageUrl ?? [""],
          status: transaction.status ?? TransactionStatus.WAITING, // Atualizado para usar status
        }}
      />
    </>
  );
};

export default UpdateTransactionAdmin;
