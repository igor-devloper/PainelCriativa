/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/app/_components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/app/_components/ui/card";
import { Alert, AlertDescription } from "@/app/_components/ui/alert";
import { Camera, AlertCircle, Settings } from "lucide-react";

interface CameraPermissionHelperProps {
  onPermissionGranted: () => void;
}

export function CameraPermissionHelper({
  onPermissionGranted,
}: CameraPermissionHelperProps) {
  const [permissionState, setPermissionState] = useState<
    "unknown" | "granted" | "denied" | "prompt"
  >("unknown");
  const [isChecking, setIsChecking] = useState(false);

  useEffect(() => {
    checkCameraPermission();
  }, []);

  const checkCameraPermission = async () => {
    setIsChecking(true);
    try {
      if (navigator.permissions) {
        const permission = await navigator.permissions.query({
          name: "camera" as PermissionName,
        });
        setPermissionState(permission.state);

        if (permission.state === "granted") {
          onPermissionGranted();
        }
      } else {
        setPermissionState("unknown");
      }
    } catch (error) {
      console.error("Erro ao verificar permissões:", error);
      setPermissionState("unknown");
    } finally {
      setIsChecking(false);
    }
  };

  const requestCameraPermission = async () => {
    setIsChecking(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach((track) => track.stop()); // Parar imediatamente
      setPermissionState("granted");
      onPermissionGranted();
    } catch (error: any) {
      console.error("Erro ao solicitar permissão:", error);
      if (error.name === "NotAllowedError") {
        setPermissionState("denied");
      }
    } finally {
      setIsChecking(false);
    }
  };

  const openBrowserSettings = () => {
    alert(`Para habilitar a câmera:

Chrome/Edge:
1. Clique no ícone de cadeado/câmera na barra de endereços
2. Selecione "Permitir" para câmera
3. Recarregue a página

Firefox:
1. Clique no ícone de escudo/câmera na barra de endereços
2. Selecione "Permitir" para câmera
3. Recarregue a página

Safari:
1. Vá em Safari > Configurações > Sites > Câmera
2. Altere para "Permitir"
3. Recarregue a página`);
  };

  if (permissionState === "granted") {
    return null; // Não mostrar nada se a permissão já foi concedida
  }

  return (
    <Card className="mx-auto w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Camera className="h-5 w-5" />
          Acesso à Câmera
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {permissionState === "denied" && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Acesso à câmera foi negado. Para usar o scanner, você precisa
              permitir o acesso à câmera.
            </AlertDescription>
          </Alert>
        )}

        {permissionState === "prompt" && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              O navegador solicitará permissão para acessar sua câmera. Clique
              em Permitir quando aparecer.
            </AlertDescription>
          </Alert>
        )}

        {permissionState === "unknown" && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Vamos verificar se podemos acessar sua câmera para o scanner de
              recibos.
            </AlertDescription>
          </Alert>
        )}

        <div className="flex flex-col gap-2">
          {permissionState !== "denied" ? (
            <Button
              onClick={requestCameraPermission}
              disabled={isChecking}
              className="w-full"
            >
              {isChecking ? "Verificando..." : "Permitir Acesso à Câmera"}
            </Button>
          ) : (
            <Button
              onClick={openBrowserSettings}
              variant="outline"
              className="w-full"
            >
              <Settings className="mr-2 h-4 w-4" />
              Como Habilitar Câmera
            </Button>
          )}

          <Button
            onClick={checkCameraPermission}
            variant="outline"
            disabled={isChecking}
            className="w-full"
          >
            Verificar Novamente
          </Button>
        </div>

        <div className="space-y-1 text-sm text-muted-foreground">
          <p>
            <strong>Dicas:</strong>
          </p>
          <p>• Certifique-se de que nenhum outro app está usando a câmera</p>
          <p>• Tente recarregar a página se houver problemas</p>
          <p>• Use HTTPS para melhor compatibilidade</p>
        </div>
      </CardContent>
    </Card>
  );
}
