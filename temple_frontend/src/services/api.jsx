
import axios from "axios";

const API = axios.create({
  baseURL: "https://temple-backend.onrender.com/api/",
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem("access");

  if (
    token &&
    !config.url.includes("token") &&
    !config.url.includes("register")
  ) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export default API;
