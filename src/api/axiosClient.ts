import axios from "axios";
import { normalizeAxiosError } from "../utils/apiHandler";

const axiosClient = axios.create({
  baseURL: "http://localhost:9000",
});

axiosClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

axiosClient.interceptors.response.use(
  (response) => response,
  (error: unknown) => Promise.reject(normalizeAxiosError(error)),
);

export default axiosClient;
