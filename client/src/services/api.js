import axios from "axios";

const api = axios.create({
    baseURL: "http://localhost:5007/api",
    withCredentials: true,
});

// Debug: confirm base URL at runtime
console.log('API baseURL:', api.defaults.baseURL);

export default api;