"use client";

import type React from "react";

import { useState, useRef } from "react";
import { Button } from "@/app/_components/ui/button";
import { Card, CardContent } from "@/app/_components/ui/card";
import { Camera, Upload, X } from "lucide-react";

interface ReceiptScannerProps {
  onImageCapture: (file: File) => void;
  onImageUpload: (files: File[]) => void;
  disabled?: boolean;
}

export function ReceiptScanner({
  onImageCapture,
  onImageUpload,
  disabled,
}: ReceiptScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment", // Câmera traseira
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
      });

      setStream(mediaStream);
      setIsScanning(true);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (error) {
      console.error("Erro ao acessar câmera:", error);
      alert("Não foi possível acessar a câmera. Verifique as permissões.");
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    setIsScanning(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");

    if (!context) return;

    // Definir dimensões do canvas
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Desenhar o frame atual do vídeo no canvas
    context.drawImage(video, 0, 0);

    // Converter para blob e criar arquivo
    canvas.toBlob(
      (blob) => {
        if (blob) {
          const file = new File([blob], `receipt-${Date.now()}.jpg`, {
            type: "image/jpeg",
          });
          onImageCapture(file);
          stopCamera();
        }
      },
      "image/jpeg",
      0.9,
    );
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length > 0) {
      onImageUpload(files);
    }
  };

  if (isScanning) {
    return (
      <Card className="mx-auto w-full max-w-md">
        <CardContent className="p-4">
          <div className="relative">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full rounded-lg"
            />
            <canvas ref={canvasRef} className="hidden" />

            {/* Overlay para guiar o usuário */}
            <div className="pointer-events-none absolute inset-0">
              <div className="absolute inset-4 rounded-lg border-2 border-dashed border-white opacity-70" />
              <div className="absolute left-2 right-2 top-2 text-center">
                <p className="rounded bg-black bg-opacity-50 px-2 py-1 text-sm text-white">
                  Posicione o recibo dentro da área marcada
                </p>
              </div>
            </div>
          </div>

          <div className="mt-4 flex gap-2">
            <Button onClick={capturePhoto} className="flex-1">
              <Camera className="mr-2 h-4 w-4" />
              Capturar
            </Button>
            <Button onClick={stopCamera} variant="outline">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex gap-2">
      <Button
        onClick={startCamera}
        disabled={disabled}
        variant="outline"
        size="sm"
      >
        <Camera className="mr-2 h-4 w-4" />
        Escanear Recibo
      </Button>

      <Button
        onClick={() => fileInputRef.current?.click()}
        disabled={disabled}
        variant="outline"
        size="sm"
      >
        <Upload className="mr-2 h-4 w-4" />
        Upload
      </Button>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileUpload}
        className="hidden"
      />
    </div>
  );
}
