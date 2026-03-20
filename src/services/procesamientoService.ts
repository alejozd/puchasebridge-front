import axiosClient from "../api/axiosClient";

export const procesarDocumentos = async (ids: number[]): Promise<void> => {
  // Simulating the API call with a delay to show loading state
  return new Promise((resolve, reject) => {
    setTimeout(async () => {
      try {
        // We make the call to the client
        await axiosClient.post("/documentos/procesar", { ids });
        resolve();
      } catch (error) {
        // Fallback or specific error handling can go here
        reject(error);
      }
    }, 1500);
  });
};
