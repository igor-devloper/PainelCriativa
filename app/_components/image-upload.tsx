"use client";

import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { cn } from "@/app/_lib/utils";

interface ImageUploadProps {
  onChange: (files: File[]) => void;
  value: File[];
  maxFiles?: number;
  isDisabled?: boolean; // Changed from disabled to isDisabled
}

export function ImageUpload({
  onChange,
  value,
  maxFiles = 3,
  isDisabled,
}: ImageUploadProps) {
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

  return (
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
  );
}
