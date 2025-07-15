import { Product, StockAlert } from '../types';
import notificationService from './notifications';

class StockAlertService {
  private alerts: StockAlert[] = [];

  // Check if a product needs a low stock alert
  checkLowStockAlert(product: Product): boolean {
    const threshold = product.minStock || 10; // Default threshold of 10
    return product.stock <= threshold;
  }

  // Create a new stock alert
  createStockAlert(product: Product): StockAlert {
    const threshold = product.minStock || 10;
    const alert: StockAlert = {
      id: Date.now().toString(),
      productId: product.id,
      productName: product.name,
      currentStock: product.stock,
      threshold,
      createdAt: new Date().toISOString(),
      isRead: false,
    };

    this.alerts.push(alert);
    return alert;
  }

  // Get all alerts
  getAlerts(): StockAlert[] {
    return this.alerts;
  }

  // Get unread alerts
  getUnreadAlerts(): StockAlert[] {
    return this.alerts.filter(alert => !alert.isRead);
  }

  // Mark alert as read
  markAlertAsRead(alertId: string): void {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.isRead = true;
    }
  }

  // Mark all alerts as read
  markAllAlertsAsRead(): void {
    this.alerts.forEach(alert => {
      alert.isRead = true;
    });
  }

  // Clear old alerts (older than 30 days)
  clearOldAlerts(): void {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    this.alerts = this.alerts.filter(alert => 
      new Date(alert.createdAt) > thirtyDaysAgo
    );
  }

  // Check products and send notifications for low stock
  async checkAndNotifyLowStock(products: Product[]): Promise<StockAlert[]> {
    const newAlerts: StockAlert[] = [];
    
    for (const product of products) {
      if (this.checkLowStockAlert(product)) {
        // Check if we already have an alert for this product
        const existingAlert = this.alerts.find(
          alert => alert.productId === product.id && !alert.isRead
        );
        
        if (!existingAlert) {
          const alert = this.createStockAlert(product);
          newAlerts.push(alert);
          
          // Send notification
          try {
            await notificationService.scheduleLowStockAlert(alert);
          } catch (error) {
            console.error('Failed to send low stock notification:', error);
          }
        }
      }
    }
    
    return newAlerts;
  }

  // Get alert count for badge
  getUnreadAlertCount(): number {
    return this.getUnreadAlerts().length;
  }
}

export default new StockAlertService(); 