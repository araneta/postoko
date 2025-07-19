import { apiClient } from './api';

export class LoyaltyService {
  async getCustomerPoints(customerId: string) {
    return apiClient.getCustomerPoints(customerId);
  }

  async getCustomerTransactions(customerId: string) {
    return apiClient.getCustomerTransactions(customerId);
  }

  async earnPoints(params: { customerId: string, orderId: string, amount: string }) {
    return apiClient.earnPoints(params);
  }

  async redeemPoints(params: { customerId: string, pointsToRedeem: number, orderId?: string }) {
    return apiClient.redeemPoints(params);
  }

  async getLoyaltySettings() {
    return apiClient.getLoyaltySettings();
  }

  async updateLoyaltySettings(settings: any) {
    return apiClient.updateLoyaltySettings(settings);
  }
}

export const loyaltyService = new LoyaltyService();
export default loyaltyService; 