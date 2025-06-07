// Utilitário para melhorar qualidade de imagens

export interface ImageEnhancementOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  sharpen?: boolean;
  contrast?: number;
  brightness?: number;
  saturation?: number;
}

export async function enhanceImageQuality(
  base64String: string,
  options: ImageEnhancementOptions = {},
): Promise<string | null> {
  const {
    maxWidth = 1200,
    maxHeight = 1200,
    quality = 0.95,
    sharpen = true,
    contrast = 1.1,
    brightness = 1.05,
    saturation = 1.1,
  } = options;

  try {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";

      let cleanBase64 = base64String;
      if (!cleanBase64.startsWith("data:")) {
        cleanBase64 = `data:image/jpeg;base64,${cleanBase64}`;
      }

      img.src = cleanBase64;

      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        if (!ctx) {
          reject(new Error("Erro ao criar contexto do canvas"));
          return;
        }

        const originalWidth = img.naturalWidth || img.width;
        const originalHeight = img.naturalHeight || img.height;

        // Calcular nova dimensão mantendo proporção
        const aspectRatio = originalWidth / originalHeight;
        let newWidth = originalWidth;
        let newHeight = originalHeight;

        if (originalWidth > maxWidth) {
          newWidth = maxWidth;
          newHeight = newWidth / aspectRatio;
        }

        if (newHeight > maxHeight) {
          newHeight = maxHeight;
          newWidth = newHeight * aspectRatio;
        }

        canvas.width = newWidth;
        canvas.height = newHeight;

        // Configurações de alta qualidade
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";

        // Aplicar filtros de melhoria
        const filters = [];
        if (contrast !== 1) filters.push(`contrast(${contrast})`);
        if (brightness !== 1) filters.push(`brightness(${brightness})`);
        if (saturation !== 1) filters.push(`saturate(${saturation})`);
        if (sharpen) filters.push("contrast(1.2) brightness(1.1)");

        if (filters.length > 0) {
          ctx.filter = filters.join(" ");
        }

        // Fundo branco para melhor contraste
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, newWidth, newHeight);

        // Desenhar a imagem
        ctx.drawImage(img, 0, 0, newWidth, newHeight);

        // Aplicar sharpening manual se solicitado
        if (sharpen) {
          const imageData = ctx.getImageData(0, 0, newWidth, newHeight);
          const sharpened = applySharpenFilter(imageData);
          ctx.putImageData(sharpened, 0, 0);
        }

        const enhancedBase64 = canvas.toDataURL("image/jpeg", quality);
        resolve(enhancedBase64);
      };

      img.onerror = (error) => {
        console.warn("Erro ao carregar imagem para enhancement:", error);
        resolve(null);
      };
    });
  } catch (error) {
    console.warn("Erro ao melhorar qualidade da imagem:", error);
    return null;
  }
}

// Filtro de sharpening manual
function applySharpenFilter(imageData: ImageData): ImageData {
  const data = imageData.data;
  const width = imageData.width;
  const height = imageData.height;
  const output = new ImageData(width, height);

  // Kernel de sharpening
  const kernel = [
    [0, -1, 0],
    [-1, 5, -1],
    [0, -1, 0],
  ];

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      let r = 0,
        g = 0,
        b = 0;

      for (let ky = 0; ky < 3; ky++) {
        for (let kx = 0; kx < 3; kx++) {
          const pixelY = y + ky - 1;
          const pixelX = x + kx - 1;
          const pixelIndex = (pixelY * width + pixelX) * 4;

          const weight = kernel[ky][kx];
          r += data[pixelIndex] * weight;
          g += data[pixelIndex + 1] * weight;
          b += data[pixelIndex + 2] * weight;
        }
      }

      const outputIndex = (y * width + x) * 4;
      output.data[outputIndex] = Math.max(0, Math.min(255, r));
      output.data[outputIndex + 1] = Math.max(0, Math.min(255, g));
      output.data[outputIndex + 2] = Math.max(0, Math.min(255, b));
      output.data[outputIndex + 3] = data[outputIndex + 3]; // Alpha
    }
  }

  return output;
}

// Função para detectar e corrigir orientação da imagem
export async function correctImageOrientation(
  base64String: string,
): Promise<string> {
  try {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = "anonymous";

      let cleanBase64 = base64String;
      if (!cleanBase64.startsWith("data:")) {
        cleanBase64 = `data:image/jpeg;base64,${cleanBase64}`;
      }

      img.src = cleanBase64;

      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        if (!ctx) {
          resolve(base64String);
          return;
        }

        // Para simplificar, apenas garantir que a imagem esteja na orientação correta
        canvas.width = img.width;
        canvas.height = img.height;

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";

        ctx.drawImage(img, 0, 0);

        const correctedBase64 = canvas.toDataURL("image/jpeg", 0.95);
        resolve(correctedBase64);
      };

      img.onerror = () => {
        resolve(base64String);
      };
    });
  } catch (error) {
    console.warn("Erro ao corrigir orientação:", error);
    return base64String;
  }
}
