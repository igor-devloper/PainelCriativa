/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/app/_components/ui/dialog";
import { Button } from "@/app/_components/ui/button";
import { Label } from "@/app/_components/ui/label";
import { toast } from "@/app/_hooks/use-toast";
import { ImageUploadAproveRequest } from "@/app/_components/ui/image-upload-aprove-request";
import { Card, CardContent } from "@/app/_components/ui/card";
import { Separator } from "@/app/_components/ui/separator";
import { Copy, Download } from "lucide-react";
import type { Request } from "@/app/types";
import { formatCurrency } from "@/app/_lib/utils";
import { generatePixQRCode } from "../_utils/pix";

interface RequestStatusDialogProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  request: Request | null;
  onConfirm: (proofBase64: string) => void;
}

export function RequestStatusDialog({
  isOpen,
  setIsOpen,
  request,
  onConfirm,
}: RequestStatusDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [proofImage, setProofImage] = useState<string>("");

  const handleConfirm = async () => {
    if (!proofImage) {
      toast({
        title: "Erro",
        description: "Por favor, faça o upload do comprovante",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await onConfirm(proofImage);
      setIsOpen(false);
      setProofImage("");
      toast({
        title: "Sucesso",
        description: "Solicitação finalizada com sucesso",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao finalizar solicitação",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copiado!",
      description: "Informação copiada para a área de transferência",
    });
  };

  const downloadQRCode = () => {
    const canvas = document.querySelector("canvas");
    if (canvas) {
      const pngUrl = canvas
        .toDataURL("image/png")
        .replace("image/png", "image/octet-stream");
      const downloadLink = document.createElement("a");
      downloadLink.href = pngUrl;
      downloadLink.download = "pix-qrcode.png";
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
    }
  };

  const getPixQRCodeValue = () => {
    if (!request?.pixKey || !request?.amount || !request?.accountHolderName)
      return "";

    return generatePixQRCode({
      pixKey: request.pixKey,
      amount: request.amount,
      merchantName: request.accountHolderName,
    });
  };

  if (!request) return null;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-h-[90vh] w-[95vw] overflow-y-auto p-4 sm:max-w-[600px] sm:p-6">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold sm:text-2xl">
            Finalizar Solicitação
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4 sm:gap-6">
          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="mb-4 flex flex-col items-start justify-between gap-2 sm:flex-row sm:items-center">
                <h3 className="text-base font-semibold sm:text-lg">
                  Valor da Solicitação
                </h3>
                <span className="text-xl font-bold text-primary sm:text-2xl">
                  {formatCurrency(request.amount)}
                </span>
              </div>

              <Separator className="my-4" />

              <div className="space-y-4">
                <h3 className="text-base font-semibold sm:text-lg">
                  Dados Bancários
                </h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <Label className="text-sm text-muted-foreground">
                      Banco
                    </Label>
                    <p className="font-medium">{request.bankName}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">
                      Tipo de Conta
                    </Label>
                    <p className="font-medium">{request.accountType}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">
                      Número da Conta
                    </Label>
                    <div className="flex items-center gap-2">
                      <p className="break-all font-medium">
                        {request.accountNumber}
                      </p>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="shrink-0"
                        onClick={() =>
                          copyToClipboard(request.accountNumber ?? "")
                        }
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">
                      Titular
                    </Label>
                    <p className="break-all font-medium">
                      {request.accountHolderName}
                    </p>
                  </div>
                </div>
              </div>

              <Separator className="my-4" />

              <div className="space-y-4">
                <h3 className="text-base font-semibold sm:text-lg">PIX</h3>
                <div className="flex flex-col gap-6 sm:flex-row">
                  <div className="flex-1 space-y-2">
                    <Label className="text-sm text-muted-foreground">
                      Chave PIX
                    </Label>
                    <div className="flex items-center gap-2">
                      <p className="break-all font-medium">{request.pixKey}</p>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="shrink-0"
                        onClick={() => copyToClipboard(request.pixKey ?? "")}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <QRCodeSVG
                      value={getPixQRCodeValue()}
                      size={120}
                      level="H"
                      includeMargin
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full text-xs sm:text-sm"
                      onClick={downloadQRCode}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Baixar QR Code
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <Label>Comprovante de Pagamento</Label>
            <ImageUploadAproveRequest
              value={proofImage}
              onChange={(value) => setProofImage(value)}
              onRemove={() => setProofImage("")}
            />
          </div>
        </div>

        <DialogFooter className="flex flex-col gap-2 sm:flex-row">
          <Button
            variant="outline"
            onClick={() => setIsOpen(false)}
            disabled={isSubmitting}
            className="w-full sm:w-auto"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isSubmitting}
            className="w-full sm:w-auto"
          >
            {isSubmitting ? "Finalizando..." : "Finalizar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
