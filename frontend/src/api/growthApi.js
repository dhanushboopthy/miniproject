import api from "./axiosClient.js";

export async function addMeasurement(payload) {
  const response = await api.post("/growth/measurement", payload);
  return response.data;
}

export async function fetchGrowthHistory(childId) {
  const response = await api.get(`/growth/${childId}`);
  return response.data;
}

export async function fetchGrowthChart(childId) {
  const response = await api.get(`/growth/${childId}/chart-data`);
  return response.data;
}

export async function fetchLatestMeasurement(childId) {
  const response = await api.get(`/growth/${childId}/latest`);
  return response.data;
}

export const growthApi = {
  addMeasurement,
  fetchGrowthHistory,
  fetchGrowthChart,
  fetchLatestMeasurement,
};
