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
            <div>${settings.storeInfo?.address || 'N/A'}</div>
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
            <div>Payment Method: ${order.paymentMethod || 'N/A'}</div>
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