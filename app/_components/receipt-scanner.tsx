/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import type React from "react";
import { useState, useRef, useEffect } from "react";
import { Button } from "@/app/_components/ui/button";
import { Card, CardContent } from "@/app/_components/ui/card";
import { Camera, Upload, X, AlertCircle, RefreshCw } from "lucide-react";
import { Alert, AlertDescription } from "@/app/_components/ui/alert";

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
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Limpar stream quando componente for desmontado
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [stream]);

  const startCamera = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Verificar se o navegador suporta getUserMedia
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Seu navegador não suporta acesso à câmera");
      }

      // Parar stream anterior se existir
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
        setStream(null);
      }

      // Configurações da câmera com fallbacks
      const constraints = {
        video: {
          facingMode: { ideal: "environment" }, // Preferir câmera traseira
          width: { ideal: 1280, max: 1920 },
          height: { ideal: 720, max: 1080 },
        },
        audio: false,
      };

      console.log("Solicitando acesso à câmera...");
      const mediaStream =
        await navigator.mediaDevices.getUserMedia(constraints);

      console.log("Câmera acessada com sucesso");
      setStream(mediaStream);
      setIsScanning(true);

      // Aguardar um pouco antes de configurar o vídeo
      setTimeout(() => {
        if (videoRef.current && mediaStream) {
          videoRef.current.srcObject = mediaStream;
          videoRef.current.play().catch((playError) => {
            console.error("Erro ao reproduzir vídeo:", playError);
            setError("Erro ao iniciar visualização da câmera");
          });
        }
      }, 100);
    } catch (error: any) {
      console.error("Erro ao acessar câmera:", error);

      let errorMessage = "Erro desconhecido ao acessar a câmera";

      if (
        error.name === "NotAllowedError" ||
        error.name === "PermissionDeniedError"
      ) {
        errorMessage =
          "Permissão de câmera negada. Verifique as configurações do navegador.";
      } else if (
        error.name === "NotFoundError" ||
        error.name === "DevicesNotFoundError"
      ) {
        errorMessage = "Nenhuma câmera encontrada no dispositivo.";
      } else if (
        error.name === "NotReadableError" ||
        error.name === "TrackStartError"
      ) {
        errorMessage = "Câmera está sendo usada por outro aplicativo.";
      } else if (
        error.name === "OverconstrainedError" ||
        error.name === "ConstraintNotSatisfiedError"
      ) {
        errorMessage = "Configurações de câmera não suportadas.";
      } else if (error.message) {
        errorMessage = error.message;
      }

      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    setIsScanning(false);
    setError(null);
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) {
      setError("Erro interno: elementos de captura não encontrados");
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");

    if (!context) {
      setError("Erro interno: contexto do canvas não disponível");
      return;
    }

    // Verificar se o vídeo está carregado
    if (video.readyState !== video.HAVE_ENOUGH_DATA) {
      setError("Aguarde a câmera carregar completamente");
      return;
    }

    try {
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
          } else {
            setError("Erro ao processar a imagem capturada");
          }
        },
        "image/jpeg",
        0.9,
      );
    } catch (error) {
      console.error("Erro ao capturar foto:", error);
      setError("Erro ao capturar a foto");
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length > 0) {
      onImageUpload(files);
    }
    // Limpar o input para permitir selecionar o mesmo arquivo novamente
    if (event.target) {
      event.target.value = "";
    }
  };

  const retryCamera = () => {
    setError(null);
    startCamera();
  };

  if (isScanning) {
    return (
      <Card className="mx-auto w-full max-w-md">
        <CardContent className="p-4">
          {error ? (
            <div className="space-y-4">
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
              <div className="flex gap-2">
                <Button
                  onClick={retryCamera}
                  variant="outline"
                  className="flex-1"
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Tentar Novamente
                </Button>
                <Button onClick={stopCamera} variant="outline">
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ) : (
            <div className="relative">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full rounded-lg bg-gray-100"
                style={{ minHeight: "200px" }}
                onLoadedData={() => console.log("Vídeo carregado")}
                onError={(e) => {
                  console.error("Erro no elemento de vídeo:", e);
                  setError("Erro ao carregar o vídeo da câmera");
                }}
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

              {/* Loading indicator */}
              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-black bg-opacity-50">
                  <div className="text-center text-white">
                    <RefreshCw className="mx-auto mb-2 h-8 w-8 animate-spin" />
                    <p>Carregando câmera...</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {!error && (
            <div className="mt-4 flex gap-2">
              <Button
                onClick={capturePhoto}
                className="flex-1"
                disabled={isLoading}
              >
                <Camera className="mr-2 h-4 w-4" />
                Capturar
              </Button>
              <Button onClick={stopCamera} variant="outline">
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex gap-2">
        <Button
          onClick={startCamera}
          disabled={disabled || isLoading}
          variant="outline"
          size="sm"
        >
          {isLoading ? (
            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Camera className="mr-2 h-4 w-4" />
          )}
          {isLoading ? "Carregando..." : "Escanear Recibo"}
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
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileUpload}
        className="hidden"
      />

      {/* Instruções para o usuário */}
      <div className="space-y-1 text-sm text-muted-foreground">
        <p>• Permita o acesso à câmera quando solicitado</p>
        <p>• Use a câmera traseira para melhor qualidade</p>
        <p>• Certifique-se de que há boa iluminação</p>
      </div>
    </div>
  );
}
