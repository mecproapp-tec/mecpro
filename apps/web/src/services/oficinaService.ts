// apps/web/src/services/oficinaService.ts

export interface OficinaData {
  nome: string;
  endereco: string;
  telefone: string;
  email: string;
  logo: string | null;
}

// 🔥 KEY PADRONIZADA
function getKey(userId: string) {
  return `oficina_${userId}`;
}

// 🔥 VALIDAÇÃO BÁSICA
function isValidOficina(data: any): data is OficinaData {
  return (
    data &&
    typeof data.nome === "string" &&
    typeof data.endereco === "string" &&
    typeof data.telefone === "string" &&
    typeof data.email === "string"
  );
}

// 🔥 GET
export const getOficinaData = (userId: string): OficinaData | null => {
  try {
    const stored = localStorage.getItem(getKey(userId));

    if (!stored) return null;

    const parsed = JSON.parse(stored);

    if (!isValidOficina(parsed)) {
      console.warn("Dados inválidos da oficina:", parsed);
      return null;
    }

    return parsed;
  } catch (error) {
    console.error("Erro ao carregar dados da oficina:", error);
    return null;
  }
};

// 🔥 SAVE
export const saveOficinaData = (
  userId: string,
  data: OficinaData
): void => {
  try {
    localStorage.setItem(getKey(userId), JSON.stringify(data));
  } catch (error) {
    console.error("Erro ao salvar dados da oficina:", error);
  }
};

// 🔥 UPLOAD LOGO (LIMITADO E SEGURO)
export const uploadLogo = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    // 🔥 VALIDAÇÃO
    if (!file.type.startsWith("image/")) {
      return reject(new Error("Arquivo deve ser uma imagem"));
    }

    if (file.size > 2 * 1024 * 1024) {
      return reject(new Error("Imagem deve ter no máximo 2MB"));
    }

    const reader = new FileReader();

    reader.onload = (e) => {
      const result = e.target?.result as string;

      // 🔥 proteção extra
      if (!result) {
        return reject(new Error("Erro ao ler imagem"));
      }

      resolve(result);
    };

    reader.onerror = () => reject(new Error("Erro ao processar imagem"));

    reader.readAsDataURL(file);
  });
};