import { Order, PrinterDevice, Settings } from '../types';
import { safeToFixed, safeToNumber, safeToInteger } from './formatters';
import { Platform, PermissionsAndroid } from 'react-native';
import { BluetoothManager } from '@brooons/react-native-bluetooth-escpos-printer';

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
            .customer-info {
              margin: 10px 0;
              font-size: 0.95em;
              background: #f7f7f7;
              border-radius: 4px;
              padding: 8px;
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
          ${order.customer ? `
            <div class="customer-info">
              <div><strong>Customer:</strong> ${order.customer.name}</div>
              ${order.customer.email ? `<div>Email: ${order.customer.email}</div>` : ''}
              ${order.customer.phone ? `<div>Phone: ${order.customer.phone}</div>` : ''}
              ${order.customer.address ? `<div>Address: ${order.customer.address}</div>` : ''}
            </div>
          ` : ''}
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
              const itemDiscount = item.discountAmount || 0;
              const itemSubtotal = itemTotal - itemDiscount;
              
              return `
                <div class="item">
                  <div>${item.name}</div>
                  <div class="item-details">
                    ${quantity} x ${formatPrice(price)} = ${formatPrice(itemTotal)}
                    ${itemDiscount > 0 ? `
                      <div style="font-size: 0.9em; color: #e74c3c;">
                        Discount: ${item.discountType === 'percentage' 
                          ? `${item.discountValue}% off` 
                          : `-${formatPrice(itemDiscount)}`
                        }
                      </div>
                      <div style="font-weight: bold;">
                        Subtotal: ${formatPrice(itemSubtotal)}
                      </div>
                    ` : ''}
                  </div>
                </div>
              `;
            }).join('')}
          </div>

          <div class="divider"></div>

          <div class="total">
            ${order.subtotal ? `
              <div class="item">
                <div>Subtotal:</div>
                <div>${formatPrice(order.subtotal)}</div>
              </div>
            ` : ''}
            
            <!-- Show item discounts separately if any exist -->
            ${(order.items || []).some(item => item.discountAmount && item.discountAmount > 0) ? `
              <div class="item">
                <div>Item Discounts:</div>
                <div style="color: #e74c3c;">-${formatPrice(
                  (order.items || []).reduce((sum, item) => sum + (item.discountAmount || 0), 0)
                )}</div>
              </div>
            ` : ''}
            
            ${order.discountAmount && order.discountAmount > 0 ? `
              <div class="item">
                <div>Order Discount${order.discountCode ? ` (${order.discountCode})` : ''}:</div>
                <div style="color: #e74c3c;">-${formatPrice(order.discountAmount)}</div>
              </div>
            ` : ''}
            
            ${order.taxAmount && order.taxAmount > 0 ? `
              <div class="item">
                <div>Tax:</div>
                <div>${formatPrice(order.taxAmount)}</div>
              </div>
            ` : ''}
            
            <div class="item" style="font-weight: bold; font-size: 1.1em; border-top: 1px solid #000; padding-top: 5px; margin-top: 5px;">
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
  try {
    console.log('Starting Bluetooth printer scan...');
    
    // Request necessary permissions for Android
    if (Platform.OS === 'android') {
      console.log('Requesting Android Bluetooth permissions...');
      const permissions = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      ]);
      
      console.log('Permission results:', permissions);
      
      // Check if all permissions were granted
      const allGranted = Object.values(permissions).every(status => status === 'granted');
      if (!allGranted) {
        console.warn('Not all Bluetooth permissions were granted');
      }
    }

    // Enable Bluetooth and get paired devices
    console.log('Enabling Bluetooth...');
    const paired = await BluetoothManager.enableBluetooth();
    console.log('Bluetooth enable result:', paired);
    console.log('Type of paired result:', typeof paired);
    
    let pairedDevices: any[] = [];
    
    // Handle different return types from enableBluetooth
    if (paired) {
      if (typeof paired === 'string') {
        const pairedString = paired; // Explicitly type as string
        try {
          // Try to parse as JSON first
          const parsed = JSON.parse(pairedString);
          pairedDevices = Array.isArray(parsed) ? parsed : [parsed];
          console.log('Successfully processed paired devices:', pairedDevices);
        } catch (parseError) {
          console.warn('Failed to parse paired devices as JSON:', parseError);
          console.log('Raw paired data:', pairedString);
          
          // Try to handle JavaScript array literal format
          try {
            // Remove the outer brackets and split by lines
            const cleaned = (pairedString as string)
              .replace(/^\[\s*/, '') // Remove opening bracket and whitespace
              .replace(/\s*\]$/, '') // Remove closing bracket and whitespace
              .split(',\n') // Split by comma and newline
              .map((line: string) => line.trim()) // Trim whitespace
              .filter((line: string) => line.length > 0); // Remove empty lines
            
            // Parse each line as JSON
            const parsedDevices = cleaned.map((line: string) => {
              try {
                return JSON.parse(line);
              } catch (e) {
                console.warn('Failed to parse line:', line);
                return null;
              }
            }).filter((device: any) => device !== null);
            
            pairedDevices = parsedDevices;
            console.log('Successfully processed devices from array literal:', pairedDevices);
          } catch (arrayLiteralError) {
            console.warn('Failed to parse array literal format:', arrayLiteralError);
            
            // Final fallback - try to extract JSON objects from the string
            if ((pairedString as string).includes('name') && (pairedString as string).includes('address')) {
              try {
                // Extract all JSON objects using regex
                const jsonMatches = (pairedString as string).match(/\{[^}]+\}/g);
                if (jsonMatches) {
                  const extractedDevices = jsonMatches.map((match: string) => {
                    try {
                      return JSON.parse(match);
                    } catch (e) {
                      return null;
                    }
                  }).filter((device: any) => device !== null);
                  pairedDevices = extractedDevices;
                  console.log('Successfully extracted devices using regex:', pairedDevices);
                }
              } catch (regexError) {
                console.warn('Failed to extract devices with regex:', regexError);
              }
            }
          }
        }
      } else if (Array.isArray(paired)) {
        // Already an array - but might contain string representations of objects
        console.log('Processing array of devices:', paired);
        
        pairedDevices = paired.map((item: any, index: number) => {
          console.log(`Processing device ${index}:`, item, typeof item);
          
          // If the item is a string, try to parse it as JSON
          if (typeof item === 'string') {
            try {
              const parsed = JSON.parse(item);
              console.log(`Successfully parsed device ${index}:`, parsed);
              return parsed;
            } catch (e) {
              console.warn(`Failed to parse device string ${index}:`, item, e);
              // Try to extract name and address manually as fallback
              const nameMatch = item.match(/"name":"([^"]+)"/);
              const addressMatch = item.match(/"address":"([^"]+)"/);
              return { 
                name: nameMatch ? nameMatch[1] : item, 
                address: addressMatch ? addressMatch[1] : 'unknown' 
              };
            }
          }
          // If it's already an object, return it as is
          console.log(`Device ${index} is already an object:`, item);
          return item;
        });
        
        console.log('Successfully processed paired devices (array):', pairedDevices);
      } else if (typeof paired === 'object') {
        // Single object, convert to array
        pairedDevices = [paired];
        console.log('Successfully processed paired devices (object):', pairedDevices);
      }
    } else {
      console.warn('Bluetooth enable returned null or undefined');
    }

    // Check if EPPOS+ printer is in paired devices
    const eposPrinters = pairedDevices.filter((device: any) => {
      const name = (device.name || '').toLowerCase();
      return name.includes('epos') || 
             name.includes('epos+') || 
             name.includes('rpp') ||  // RPP02N pattern
             name.includes('pos');    // Generic POS printer
    });
    
    console.log('EPPOS+ printers found:', eposPrinters);
    
    if (eposPrinters.length === 0) {
      console.warn('No EPPOS+ printers found in paired devices');
      console.log('All available devices:', pairedDevices.map(d => ({ name: d.name, address: d.address })));
      
      // Check if there are any devices that might be the EPPOS+ printer
      const suspiciousDevices = pairedDevices.filter((device: any) => {
        const name = (device.name || '').toLowerCase();
        return name.includes('ep') || name.includes('pos') || name.includes('printer');
      });
      
      if (suspiciousDevices.length > 0) {
        console.log('Devices that might be your printer:', suspiciousDevices);
      } else {
        console.log('Make sure your EPPOS+ printer is:');
        console.log('1. Turned on and in pairing mode');
        console.log('2. Already paired with your Android device');
        console.log('3. Within Bluetooth range');
        console.log('4. Not connected to another device');
      }
    }

    // Transform the devices to match PrinterDevice interface
    const printers: PrinterDevice[] = pairedDevices.map((device: any) => ({
      deviceId: device.address || device.mac_address || 'unknown',
      deviceName: device.name || device.device_name || 'Unknown Device',
      address: device.address || device.mac_address || 'unknown',
    }));

    console.log('Final printer list:', printers);
    return printers;
  } catch (error) {
    console.error('Failed to scan Bluetooth printers:', error);
    throw new Error('Failed to scan Bluetooth printers: ' + (error as Error).message);
  }
}