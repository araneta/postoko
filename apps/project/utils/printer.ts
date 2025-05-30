import { Platform } from 'react-native';
import { PrinterSettings, Order } from '../types';

// Mock implementation for web
const webPrinter = {
  async print(order: Order) {
    // Create a new window for the receipt
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      throw new Error('Failed to open print window');
    }

    // Generate receipt HTML
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

    // Write the HTML to the new window and trigger print
    printWindow.document.write(html);
    printWindow.document.close();
  },
};

// Initialize platform-specific printer
const printer = Platform.select({
  web: webPrinter,
  default: require('react-native-thermal-receipt-printer').default,
});

export async function printReceipt(order: Order, settings: PrinterSettings) {
  if (Platform.OS === 'web') {
    return webPrinter.print(order);
  }

  try {
    if (!settings.deviceId) {
      throw new Error('No printer configured');
    }

    const receiptContent = generateReceiptContent(order);

    if (settings.type === 'bluetooth') {
      await printer.connectBluetoothPrinter(settings.address);
    } else {
      await printer.connectPrinter(settings.deviceId);
    }

    await printer.printText(receiptContent);
    await printer.disconnectPrinter();
  } catch (error) {
    console.error('Printing failed:', error);
    throw error;
  }
}

export async function scanPrinters(): Promise<PrinterDevice[]> {
  if (Platform.OS === 'web') {
    return [];
  }

  try {
    const devices = await printer.scanDevices();
    return devices.map(device => ({
      deviceId: device.device_id,
      deviceName: device.device_name,
      address: device.address,
    }));
  } catch (error) {
    console.error('Scanner failed:', error);
    throw error;
  }
}

function generateReceiptContent(order: Order): string {
  const date = new Date(order.date);
  const formattedDate = date.toLocaleDateString();
  const formattedTime = date.toLocaleTimeString();

  let receipt = '\x1B\x40'; // Initialize printer
  receipt += '\x1B\x61\x01'; // Center alignment

  receipt += 'Your Store Name\n';
  receipt += '123 Store Street\n';
  receipt += 'City, Country\n\n';

  receipt += `Order #${order.id}\n`;
  receipt += `${formattedDate} ${formattedTime}\n\n`;

  receipt += '\x1B\x61\x00'; // Left alignment

  // Items
  receipt += 'Items:\n';
  receipt += '--------------------------------\n';
  order.items.forEach(item => {
    receipt += `${item.name}\n`;
    receipt += `  ${item.quantity} x $${item.price.toFixed(2)} = $${(item.quantity * item.price).toFixed(2)}\n`;
  });
  receipt += '--------------------------------\n\n';

  // Total
  receipt += `Total: $${order.total.toFixed(2)}\n`;
  receipt += `Payment Method: ${order.paymentMethod}\n\n`;

  receipt += '\x1B\x61\x01'; // Center alignment
  receipt += 'Thank you for your purchase!\n';
  receipt += 'Please come again\n\n\n\n';

  return receipt;
}