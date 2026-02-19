import axios from "axios";

const API = axios.create({
  baseURL: "https://nakshatra-temple-app.onrender.com/api/",
});

// =============================
// Attach Access Token
// =============================
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

// =============================
// Auto Refresh Token
// =============================
API.interceptors.response.use(
  (response) => response,
  async (error) => {

    const originalRequest = error.config;

    if (
      error.response &&
      error.response.status === 401 &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;

      const refreshToken = localStorage.getItem("refresh");

      if (!refreshToken) {
        logoutUser();
        return Promise.reject(error);
      }

      try {
        const response = await axios.post(
          "https://nakshatra-temple-app.onrender.com/api/token/refresh/",
          { refresh: refreshToken }
        );

        const newAccessToken = response.data.access;

        localStorage.setItem("access", newAccessToken);

        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

        return API(originalRequest);

      } catch (refreshError) {
        logoutUser();
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// =============================
// Logout Helper
// =============================
function logoutUser() {
  localStorage.removeItem("access");
  localStorage.removeItem("refresh");
  window.location.href = "/login";
}

export default API;
