import api from "./axiosClient.js";

export async function logDiet(payload) {
  const response = await api.post("/nutrition/log", payload);
  return response.data;
}

export async function fetchNutritionLog(logId) {
  const response = await api.get(`/nutrition/log/${logId}`);
  return response.data;
}

export async function fetchNutritionHistory(childId) {
  const response = await api.get(`/nutrition/${childId}/history`);
  return response.data;
}

export async function askNutritionQuestion(payload) {
  const response = await api.post("/nutrition/ask", payload);
  return response.data;
}

export async function generateMealPlan(payload) {
  const response = await api.post("/mealplan/generate", payload);
  return response.data;
}

export async function fetchMealPlan(childId) {
  const response = await api.get(`/mealplan/${childId}/latest`);
  return response.data;
}
