/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useCallback, useState } from "react";
import { FileUploader } from "react-drag-drop-files";
import { toast } from "@/app/_hooks/use-toast";
import { cn } from "@/app/_lib/utils";
import { Upload, X } from "lucide-react";
import Image from "next/image";

interface ImageUploadProps {
  value: string;
  onChange: (value: string) => void;
  onRemove: () => void;
  disabled?: boolean;
}

export function ImageUploadAproveRequest({
  value,
  onChange,
  onRemove,
  disabled,
}: ImageUploadProps) {
  const [loading, setLoading] = useState(false);

  const handleChange = useCallback(
    (file: File) => {
      setLoading(true);

      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Erro",
          description: "A imagem deve ter no máximo 5MB",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        onChange(reader.result as string);
        setLoading(false);
      };
      reader.readAsDataURL(file);
    },
    [onChange],
  );

  if (value) {
    return (
      <div className="relative inline-block">
        <Image
          src={value || "/placeholder.svg"}
          alt="Upload"
          className="rounded-md object-cover"
          width={200}
          height={200}
        />
        <button
          onClick={onRemove}
          className="absolute right-2 top-2 rounded-full bg-red-500 p-1 text-white transition hover:bg-red-600"
          type="button"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <FileUploader
      handleChange={handleChange}
      name="file"
      types={["JPG", "PNG", "JPEG"]}
      disabled={disabled}
    >
      <div
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center gap-4 rounded-md border-2 border-dashed p-6 transition hover:border-primary",
          disabled && "cursor-not-allowed opacity-50",
        )}
      >
        <Upload className="h-10 w-10 text-muted-foreground" />
        <div className="text-center">
          <p className="text-sm font-medium">
            Arraste uma imagem ou clique para fazer upload
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            PNG, JPG ou JPEG (max. 5MB)
          </p>
        </div>
      </div>
    </FileUploader>
  );
}
