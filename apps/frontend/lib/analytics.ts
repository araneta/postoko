import { apiClient } from './api';

export class AnalyticsService {
  async getAnalytics() {
    return apiClient.getAnalytics();
  }

  async getSalesReport(period: 'daily' | 'weekly' | 'monthly' = 'daily') {
    return apiClient.getSalesReport(period);
  }

  async getBestSellers(limit: number = 10, period: 'all' | 'week' | 'month' | 'year' = 'all') {
    return apiClient.getBestSellers(limit, period);
  }

  async getPeakHours(days: number = 30) {
    return apiClient.getPeakHours(days);
  }

  async getProfitMargin(period: 'week' | 'month' | 'year' = 'month') {
    return apiClient.getProfitMargin(period);
  }
}

export const analyticsService = new AnalyticsService();
export default analyticsService; 