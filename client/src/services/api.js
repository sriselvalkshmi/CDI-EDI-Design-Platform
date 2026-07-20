import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.PROD
    ? "https://cdi-edi-design-platform-1.onrender.com/api"
    : "http://localhost:5007/api",
  withCredentials: true,
});

console.log("API baseURL:", api.defaults.baseURL);

export default api;