import api from "./axiosClient.js";

export async function login(payload) {
  const response = await api.post("/auth/login", payload);
  return response.data;
}

export async function fetchMe() {
  const response = await api.get("/auth/me");
  return response.data;
}

export async function signup(payload) {
  const response = await api.post("/auth/signup", payload);
  return response.data;
}
