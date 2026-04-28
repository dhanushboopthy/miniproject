import api from "./axiosClient.js";

export async function listChildren() {
  const response = await api.get("/children/");
  return response.data;
}

export async function createChild(payload) {
  const response = await api.post("/children/", payload);
  return response.data;
}
