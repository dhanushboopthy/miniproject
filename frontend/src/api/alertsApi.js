import axios from 'axios';
import axiosClient from './axiosClient';

export const alertsApi = {
  // Get all active/unresolved alerts for user's AWC
  getAlerts: async (awcCode, status = null) => {
    const params = {};
    if (status) params.status = status;
    return axiosClient.get('/alerts', { params });
  },

  // Get specific alert
  getAlert: async (alertId) => {
    return axiosClient.get(`/alerts/${alertId}`);
  },

  // Get alerts for a child (for child profile)
  getChildAlerts: async (childId) => {
    return axiosClient.get(`/alerts/child/${childId}`);
  },

  // Mark alert as acknowledged
  acknowledgeAlert: async (alertId) => {
    return axiosClient.post(`/alerts/${alertId}/acknowledge`);
  },

  // Mark alert as resolved
  resolveAlert: async (alertId) => {
    return axiosClient.post(`/alerts/${alertId}/resolve`);
  },

  // Get count of active alerts
  getActiveCount: async (awcCode) => {
    return axiosClient.get('/alerts/stats/active-count');
  },
};

export const reportsApi = {
  // Get monthly report for AWC
  getAWCReport: async (awcCode, year, month) => {
    return axiosClient.get('/reports/awc/monthly', {
      params: { year, month }
    });
  },

  // Get block summary
  getBlockReport: async (blockCode, year, month) => {
    return axiosClient.get('/reports/block/summary', {
      params: { block_code: blockCode, year, month }
    });
  },

  // Get nutrition trend data
  getNutritionTrend: async (awcCode, days = 30) => {
    return axiosClient.get('/reports/nutrition/trend', {
      params: { days }
    });
  },

  // Export AWC report as PDF or Excel
  exportAWCReport: async (awcCode, year, month, format = 'pdf') => {
    return axiosClient.post('/reports/awc/export', null, {
      params: { year, month, format }
    });
  },
};
