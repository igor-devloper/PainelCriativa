export const revalidate = 0;

import { FileImage, X } from "lucide-react";
import Image from "next/image";
import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Button } from "./ui/button";

interface ImageUploadProps {
  onChange: (files: File[]) => void;
  value: File[];
  maxFiles?: number;
}

export function ImageUpload({
  onChange,
  value = [],
  maxFiles = 5,
}: ImageUploadProps) {
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const newFiles = [...value, ...acceptedFiles].slice(0, maxFiles);
      onChange(newFiles);
    },
    [maxFiles, onChange, value],
  );

  const removeFile = (index: number) => {
    const newFiles = value.filter((_, i) => i !== index);
    onChange(newFiles);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".png", ".jpg", ".jpeg", ".gif"],
    },
    maxFiles: maxFiles - value.length,
    multiple: true,
  });

  return (
    <div className="space-y-4">
      {value.length < maxFiles && (
        <div
          {...getRootProps()}
          className={`cursor-pointer rounded-lg border-2 border-dashed p-4 text-center transition-colors ${isDragActive ? "border-primary bg-primary/10" : "border-muted-foreground/25"} `}
        >
          <input {...getInputProps()} />
          <div className="flex items-center justify-center">
            <FileImage size={24} className="mr-2" />
            <span>
              {isDragActive
                ? "Solte as imagens aqui"
                : "Arraste ou clique para selecionar"}
            </span>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            PNG, JPG ou GIF. Máximo {maxFiles} arquivos.
          </p>
        </div>
      )}

      {value.length > 0 && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {value.map((file, index) => (
            <div key={file.name} className="group relative aspect-square">
              <Image
                src={URL.createObjectURL(file)}
                alt={`Preview ${index + 1}`}
                className="rounded-lg object-cover"
                fill
              />
              <Button
                onClick={() => removeFile(index)}
                className="absolute right-2 top-2 h-8 w-8 p-0"
                variant="destructive"
                size="icon"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
