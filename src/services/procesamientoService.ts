import axiosClient from "../api/axiosClient";

export const procesarDocumentos = async (ids: number[]): Promise<void> => {
  // Simulating the API call with a delay to show loading state
  return new Promise((resolve, reject) => {
    setTimeout(async () => {
      try {
        // We still make the call to the client for when the backend is ready
        // But for mock purposes we'll resolve
        // await axiosClient.post("/documentos/procesar", { ids });

        // Simulating random success/error
        if (Math.random() > 0.1) {
            resolve();
        } else {
            reject(new Error("Simulated backend error"));
        }
      } catch (error) {
        reject(error);
      }
    }, 1500);
  });
};
