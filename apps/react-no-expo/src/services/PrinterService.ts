import {Alert} from 'react-native';
import {Order, PrinterSettings} from '../types';

class PrinterServiceClass {
  async printReceipt(order: Order, settings: PrinterSettings): Promise<void> {
    try {
      // For now, we'll just show an alert with the receipt details
      // In a real implementation, you would integrate with a Bluetooth printer
      const receiptText = this.generateReceiptText(order);
      
      Alert.alert(
        'Receipt',
        receiptText,
        [
          {
            text: 'OK',
            style: 'default',
          },
        ],
        {cancelable: true},
      );
    } catch (error) {
      console.error('Printing failed:', error);
      throw error;
    }
  }

  private generateReceiptText(order: Order): string {
    let receipt = '=== RECEIPT ===\n\n';
    receipt += `Order #${order.id}\n`;
    receipt += `Date: ${new Date(order.date).toLocaleString()}\n\n`;
    
    receipt += 'Items:\n';
    receipt += '------------------------\n';
    order.items.forEach(item => {
      receipt += `${item.name}\n`;
      receipt += `  ${item.quantity} x $${item.price.toFixed(2)} = $${(item.quantity * item.price).toFixed(2)}\n`;
    });
    receipt += '------------------------\n\n';
    
    receipt += `Total: $${order.total.toFixed(2)}\n`;
    receipt += `Payment Method: ${order.paymentMethod}\n\n`;
    
    receipt += 'Thank you for your purchase!\n';
    receipt += 'Please come again';
    
    return receipt;
  }
}

export const PrinterService = new PrinterServiceClass();