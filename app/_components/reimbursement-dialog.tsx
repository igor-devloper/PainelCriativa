/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import type React from "react";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/app/_components/ui/dialog";
import { Button } from "@/app/_components/ui/button";
import { Input } from "@/app/_components/ui/input";
import { Label } from "@/app/_components/ui/label";
import { completeReimbursement } from "@/app/_actions/complete-reimbursement";
import { useToast } from "@/app/_hooks/use-toast";

interface ReimbursementDialogProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  requestId: string | null;
  onSuccess: () => void;
}

export function ReimbursementDialog({
  isOpen,
  setIsOpen,
  requestId,
  onSuccess,
}: ReimbursementDialogProps) {
  const [proofUrl, setProofUrl] = useState("");
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!requestId) return;

    try {
      await completeReimbursement(requestId, proofUrl);
      onSuccess();
      toast({
        title: "Reembolso processado",
        description: "O reembolso foi processado com sucesso.",
      });
    } catch (error) {
      toast({
        title: "Erro ao processar reembolso",
        description:
          "Ocorreu um erro ao processar o reembolso. Por favor, tente novamente.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Processar Reembolso</DialogTitle>
          <DialogDescription>
            Insira a URL do comprovante de reembolso para finalizar o processo.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid w-full items-center gap-4">
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="proofUrl">URL do Comprovante</Label>
              <Input
                id="proofUrl"
                placeholder="https://exemplo.com/comprovante.pdf"
                value={proofUrl}
                onChange={(e) => setProofUrl(e.target.value)}
              />
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <Button type="submit">Processar Reembolso</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
