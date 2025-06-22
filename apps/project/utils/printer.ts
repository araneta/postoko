import { Order, PrinterDevice } from '../types';

// Web printer implementation remains unchanged
const webPrinter = {
  async print(order: Order) {
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
            <div class="store-name">Your Store Name</div>
            <div>123 Store Street</div>
            <div>City, Country</div>
          </div>

          <div>
            <div>Order #${order.id}</div>
            <div>Date: ${new Date(order.date).toLocaleDateString()}</div>
            <div>Time: ${new Date(order.date).toLocaleTimeString()}</div>
          </div>

          <div class="divider"></div>

          <div>
            ${order.items.map(item => `
              <div class="item">
                <div>${item.name}</div>
                <div class="item-details">
                  ${item.quantity} x $${item.price.toFixed(2)} = $${(item.quantity * item.price).toFixed(2)}
                </div>
              </div>
            `).join('')}
          </div>

          <div class="divider"></div>

          <div class="total">
            <div class="item">
              <div>Total:</div>
              <div>$${order.total.toFixed(2)}</div>
            </div>
            <div>Payment Method: ${order.paymentMethod}</div>
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

export async function printReceipt(order: Order) {
  return webPrinter.print(order);
}

export async function scanPrinters(): Promise<PrinterDevice[]> {
  // Stub: Replace with actual implementation for native platforms
  return [];
}