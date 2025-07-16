import { apiClient } from './api';

export class AnalyticsService {
  async getAnalytics() {
    return apiClient.getAnalytics();
  }

  async getSalesReport(period: 'daily' | 'weekly' | 'monthly' = 'daily') {
    return apiClient.getSalesReport(period);
  }
}

export const analyticsService = new AnalyticsService();
export default analyticsService; 