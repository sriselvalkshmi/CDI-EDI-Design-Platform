import axios from "axios";
import supabase from "./supabaseClient";

const getBaseURL = () => {
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
  if (import.meta.env.VITE_API_BASE_URL) return import.meta.env.VITE_API_BASE_URL;
  if (import.meta.env.PROD) return "https://cdi-edi-design-platform-1.onrender.com/api";
  return "http://localhost:5007/api";
};

const api = axios.create({
  baseURL: getBaseURL(),
  withCredentials: true,
});

api.interceptors.request.use(async (config) => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session && session.access_token) {
      config.headers.Authorization = `Bearer ${session.access_token}`;
    }
  } catch (e) {
    console.warn("Failed to attach Supabase session token to API request:", e);
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

export default api;