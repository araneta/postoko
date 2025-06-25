import { Order, PrinterDevice, Settings } from '../types';
import { safeToFixed, safeToNumber, safeToInteger } from './formatters';

// Web printer implementation remains unchanged
const webPrinter = {
  async print(order: Order, settings: Settings, formatPrice: (price: number) => string) {
    console.log('printing order', order);
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      throw new Error('Failed to open print window');
    }

    const formatPaymentMethod = (method: string) => {
      switch (method) {
        case 'cash': return 'Cash';
        case 'card': return 'Card';
        case 'digital_wallet': return 'Digital Wallet';
        case 'bank_transfer': return 'Bank Transfer';
        default: return method;
      }
    };

    const formatWalletType = (walletType?: string) => {
      switch (walletType) {
        case 'apple_pay': return 'Apple Pay';
        case 'google_pay': return 'Google Pay';
        case 'paypal': return 'PayPal';
        default: return '';
      }
    };

    const renderPaymentDetails = () => {
      if (!order.paymentDetails || order.paymentDetails.length === 0) {
        return `<div>Payment Method: ${formatPaymentMethod(order.paymentMethod)}</div>`;
      }

      return order.paymentDetails.map((payment, index) => {
        let paymentInfo = `<div>${formatPaymentMethod(payment.method)}: ${formatPrice(payment.amount)}</div>`;
        
        if (payment.transactionId) {
          paymentInfo += `<div style="font-size: 0.8em; color: #666;">Transaction ID: ${payment.transactionId}</div>`;
        }
        
        if (payment.cardLast4) {
          paymentInfo += `<div style="font-size: 0.8em; color: #666;">Card: ****${payment.cardLast4} (${payment.cardBrand})</div>`;
        }
        
        if (payment.walletType) {
          paymentInfo += `<div style="font-size: 0.8em; color: #666;">Wallet: ${formatWalletType(payment.walletType)}</div>`;
        }
        
        if (payment.change && payment.change > 0) {
          paymentInfo += `<div style="font-size: 0.8em; color: #666;">Change: ${formatPrice(payment.change)}</div>`;
        }
        
        return paymentInfo;
      }).join('');
    };

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Receipt #${order.id}</title>
          <style>
            body {
              font-family: 'Courier New', monospace;
              max-width: 300px;
              margin: 20px auto;
              padding: 20px;
            }
            .header {
              text-align: center;
              margin-bottom: 20px;
            }
            .store-name {
              font-size: 1.2em;
              font-weight: bold;
            }
            .divider {
              border-top: 1px dashed #000;
              margin: 10px 0;
            }
            .item {
              display: flex;
              justify-content: space-between;
              margin: 5px 0;
            }
            .item-details {
              margin-left: 20px;
            }
            .total {
              margin-top: 10px;
              font-weight: bold;
            }
            .payment-details {
              margin-top: 10px;
              padding: 10px;
              background-color: #f8f9fa;
              border-radius: 4px;
            }
            .footer {
              text-align: center;
              margin-top: 20px;
              font-size: 0.9em;
            }
            @media print {
              body {
                margin: 0;
                padding: 10px;
              }
              @page {
                size: 80mm 297mm;
                margin: 0;
              }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="store-name">${settings.storeInfo?.name || 'N/A'}</div>
            <div>
            <div>${settings.storeInfo?.phone || 'N/A'}</div>
            <div>${settings.storeInfo?.email || 'N/A'}</div>
            <div>${settings.storeInfo?.website || 'N/A'}</div>
            <div>${settings.storeInfo?.taxId || 'N/A'}</div>
          </div>

          <div>
            <div>Order #${order.id || 'N/A'}</div>
            <div>Date: ${order.date ? new Date(order.date).toLocaleDateString() : 'N/A'}</div>
            <div>Time: ${order.date ? new Date(order.date).toLocaleTimeString() : 'N/A'}</div>
          </div>

          <div class="divider"></div>

          <div>
            ${(order.items || []).map(item => {
              const price = safeToNumber(item.price);
              const quantity = safeToInteger(item.quantity);
              const itemTotal = price * quantity;
              return `
                <div class="item">
                  <div>${item.name}</div>
                  <div class="item-details">
                    ${quantity} x ${formatPrice(price)} = ${formatPrice(itemTotal)}
                  </div>
                </div>
              `;
            }).join('')}
          </div>

          <div class="divider"></div>

          <div class="total">
            <div class="item">
              <div>Total:</div>
              <div>${formatPrice(order.total || 0)}</div>
            </div>
          </div>

          <div class="payment-details">
            ${renderPaymentDetails()}
          </div>

          <div class="footer">
            <div>Thank you for your purchase!</div>
            <div>Please come again</div>
          </div>

          <script>
            window.onload = () => {
              window.print();
              setTimeout(() => window.close(), 500);
            };
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
  },
};

export async function printReceipt(order: Order, settings: Settings, formatPrice: (price: number) => string) {
  console.log('printing receipt', order, settings);
  return webPrinter.print(order, settings, formatPrice);
}

export async function scanPrinters(): Promise<PrinterDevice[]> {
  // Stub: Replace with actual implementation for native platforms
  return [];
}