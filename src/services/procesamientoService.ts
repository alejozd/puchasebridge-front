import { handleResponse, BASE_URL, getHeaders } from "../utils/apiHandler";

export const procesarDocumentos = async (ids: number[]): Promise<void> => {
  // Simulating the API call with a delay to show loading state
  return new Promise((resolve, reject) => {
    setTimeout(async () => {
      try {
        const response = await fetch(`${BASE_URL}/documentos/procesar`, {
          method: "POST",
          headers: getHeaders(),
          body: JSON.stringify({ ids }),
        });
        await handleResponse(response);
        resolve();
      } catch (error: unknown) {
        reject(error);
      }
    }, 1500);
  });
};
