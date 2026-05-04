const BASE_URL = import.meta.env.VITE_BASE_URL || "/api";

const getToken = () => localStorage.getItem("token");

const getHeaders = ({ isJson = true, token } = {}) => {
  const headers = {};
  if (isJson) headers["Content-Type"] = "application/json";
  const t = token ?? getToken();
  if (t) headers["Authorization"] = `Bearer ${t}`;
  return headers;
};

const handleError = async (response) => {
  const isLoginRequest = response.url.includes("/auth/login");
  const isOnLoginPage = window.location.pathname === "/login";

  if (response.status === 401 && !isLoginRequest && !isOnLoginPage) {
    localStorage.removeItem("token");
    window.location.href = "/login";
    throw new Error("Sesión expirada");
  }

  let message = "Error desconocido";
  const bodyText = await response.text();

  try {
    const data = JSON.parse(bodyText);
    message = data.message || data.error || message;
  } catch {
    if (bodyText) message = bodyText;
  }

  throw new Error(message);
};

const request = async (
  endpoint,
  { method = "GET", params, body, isJson = true, token } = {}
) => {
  let url = `${BASE_URL}${endpoint}`;
  if (params) url += `?${new URLSearchParams(params)}`;

  // FormData maneja su propio Content-Type (incluido el boundary). Si lo
  // seteamos a mano, el browser no agrega el boundary y el server falla.
  const isFormData = typeof FormData !== "undefined" && body instanceof FormData;
  const useJsonContentType = isJson && !isFormData;

  const response = await fetch(url, {
    method,
    headers: getHeaders({ isJson: useJsonContentType, token }),
    body: useJsonContentType && body ? JSON.stringify(body) : body,
  });

  if (!response.ok) await handleError(response);

  if (response.status === 204) return null;
  return response.json();
};

const get = (endpoint, params, options) =>
  request(endpoint, { method: "GET", params, ...options });
const post = (endpoint, body, isJson = true, options) =>
  request(endpoint, { method: "POST", body, isJson, ...options });
const put = (endpoint, body, isJson = true, options) =>
  request(endpoint, { method: "PUT", body, isJson, ...options });
const del = (endpoint, options) =>
  request(endpoint, { method: "DELETE", ...options });

// Helper específico para uploads multipart. Acepta un File y lo manda como
// campo 'file' en un FormData.
const upload = (endpoint, file, { method = "POST", token } = {}) => {
  const fd = new FormData();
  fd.append("file", file);
  return request(endpoint, { method, body: fd, isJson: false, token });
};

export const requestAPI = { get, post, put, del, request, upload };

export default requestAPI;

