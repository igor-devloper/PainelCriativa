"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { cn } from "@/app/_lib/utils";
import { ReceiptScanner } from "./receipt-scanner";
import { CameraPermissionHelper } from "./camera-permission-helper";
import { Button } from "@/app/_components/ui/button";
import { X, Eye } from "lucide-react";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/app/_components/ui/dialog";

interface ImageUploadProps {
  onChange: (files: File[]) => void;
  value: File[];
  maxFiles?: number;
  isDisabled?: boolean;
}

export function ImageUpload({
  onChange,
  value,
  maxFiles = 3,
  isDisabled,
}: ImageUploadProps) {
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [showScanner, setShowScanner] = useState(false);
  const [cameraPermissionGranted, setCameraPermissionGranted] = useState(false);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const remainingSlots = maxFiles - value.length;
      const filesToAdd = acceptedFiles.slice(0, remainingSlots);
      onChange([...value, ...filesToAdd]);
    },
    [maxFiles, onChange, value],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/jpeg": [],
      "image/png": [],
      "image/gif": [],
    },
    maxFiles: maxFiles - value.length,
    disabled: isDisabled,
  });

  const handleScannerCapture = (file: File) => {
    if (value.length < maxFiles) {
      onChange([...value, file]);
    }
    setShowScanner(false);
  };

  const handleScannerUpload = (files: File[]) => {
    const remainingSlots = maxFiles - value.length;
    const filesToAdd = files.slice(0, remainingSlots);
    onChange([...value, ...filesToAdd]);
    setShowScanner(false);
  };

  const removeFile = (index: number) => {
    const newFiles = value.filter((_, i) => i !== index);
    onChange(newFiles);
  };

  const previewFile = (file: File) => {
    const url = URL.createObjectURL(file);
    setPreviewImage(url);
  };

  const handleOpenScanner = () => {
    if (cameraPermissionGranted) {
      setShowScanner(true);
    } else {
      // Mostrar helper de permissão primeiro
      setShowScanner(true);
    }
  };

  return (
    <div className="space-y-4">
      {/* Scanner de Recibos */}
      <div className="flex justify-center">
        <Button
          onClick={handleOpenScanner}
          disabled={isDisabled || value.length >= maxFiles}
          variant="outline"
          size="sm"
        >
          Escanear Recibo
        </Button>
      </div>

      {/* Área de Drop tradicional */}
      <div
        {...getRootProps()}
        className={cn(
          "cursor-pointer rounded-lg border-2 border-dashed p-4 text-center transition hover:border-gray-400",
          isDragActive && "border-primary",
          isDisabled && "cursor-not-allowed opacity-50",
        )}
      >
        <input {...getInputProps()} />
        <p className="text-sm text-muted-foreground">
          {isDisabled
            ? "Limite máximo de arquivos atingido"
            : "Arraste ou clique para selecionar"}
        </p>
        {value.length > 0 && (
          <p className="mt-2 text-xs text-muted-foreground">
            {value.length} arquivo(s) selecionado(s)
          </p>
        )}
      </div>

      {/* Preview dos arquivos */}
      {value.length > 0 && (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {value.map((file, index) => (
            <div key={index} className="group relative">
              <div className="aspect-square overflow-hidden rounded-lg border bg-muted">
                <Image
                  src={URL.createObjectURL(file) || "/placeholder.svg"}
                  alt={`Preview ${index + 1}`}
                  width={100}
                  height={100}
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="absolute right-1 top-1 opacity-0 transition-opacity group-hover:opacity-100">
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => removeFile(index)}
                  className="h-6 w-6 p-0"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
              <div className="absolute left-1 top-1 opacity-0 transition-opacity group-hover:opacity-100">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => previewFile(file)}
                  className="h-6 w-6 p-0"
                >
                  <Eye className="h-3 w-3" />
                </Button>
              </div>
              <p className="mt-1 truncate text-center text-xs">{file.name}</p>
            </div>
          ))}
        </div>
      )}

      {/* Dialog de Preview */}
      <Dialog open={!!previewImage} onOpenChange={() => setPreviewImage(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Preview da Imagem</DialogTitle>
          </DialogHeader>
          {previewImage && (
            <div className="flex justify-center">
              <Image
                src={previewImage || "/placeholder.svg"}
                alt="Preview"
                width={600}
                height={600}
                className="h-auto max-w-full rounded-lg"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog do Scanner */}
      
    </div>
  );
}
