import { useState } from "react";
import Image from "next/image";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTrigger,
} from "@/app/_components/ui/dialog";
import { X } from "lucide-react";

interface ImageGalleryProps {
  images: string[];
}

export function ImageGallery({ images }: ImageGalleryProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  if (images.length === 0) {
    return (
      <div className="text-sm text-muted-foreground">
        Sem imagens disponíveis
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {images.map((image, index) => (
        <Dialog key={index}>
          <DialogTrigger asChild>
            <div className="relative h-12 w-12 cursor-pointer">
              <Image
                src={image}
                alt={`Comprovante ${index + 1}`}
                fill
                className="rounded-md object-cover"
                sizes="(max-width: 48px) 100vw, 48px"
                onClick={() => setSelectedImage(image)}
              />
            </div>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <div className="relative aspect-square">
              <Image
                src={selectedImage || image}
                alt="Comprovante ampliado"
                fill
                className="object-contain"
                sizes="(max-width: 425px) 100vw, 425px"
              />
            </div>
            <DialogClose
              asChild
              onClick={() => setSelectedImage(null)}
              className="absolute right-2 top-2 rounded-full bg-background/80 p-1 text-foreground"
            >
              <X className="h-4 w-4" />
            </DialogClose>
          </DialogContent>
        </Dialog>
      ))}
    </div>
  );
}
