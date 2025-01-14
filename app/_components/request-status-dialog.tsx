"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/app/_components/ui/dialog";
import { Button } from "@/app/_components/ui/button";
import { ImageUpload } from "@/app/_components/image-upload";
import { toast } from "@/app/_hooks/use-toast";
import { uploadProof } from "@/app/_actions/upload-proof";
import { Request } from "@/app/types";

interface RequestStatusDialogProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  request: Request | null;
  onComplete: () => void;
}

export function RequestStatusDialog({
  isOpen,
  setIsOpen,
  request,
  onComplete,
}: RequestStatusDialogProps) {
  const [images, setImages] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  async function handleUpload() {
    if (!request || images.length === 0) return;

    setIsUploading(true);
    try {
      const imagesBase64 = await Promise.all(
        images.map((file) => fileToBase64(file)),
      );

      await uploadProof(request.id, imagesBase64);
      toast({
        title: "Comprovante enviado",
        description: "O comprovante foi enviado com sucesso.",
      });
      onComplete();
    } catch (error) {
      console.error(error);
      toast({
        title: "Erro ao enviar comprovante",
        description:
          "Ocorreu um erro ao enviar o comprovante. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  }

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Enviar Comprovante</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <ImageUpload onChange={setImages} value={images} maxFiles={1} />
        </div>
        <DialogFooter>
          <Button onClick={() => setIsOpen(false)} variant="outline">
            Cancelar
          </Button>
          <Button
            onClick={handleUpload}
            disabled={isUploading || images.length === 0}
          >
            {isUploading ? "Enviando..." : "Enviar Comprovante"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
