declare module 'react-native-bluetooth-escpos-printer' {
  const BluetoothManager: {
    enableBluetooth(): Promise<string[]>;
    disableBluetooth(): Promise<void>;
    isBluetoothEnabled(): Promise<boolean>;
    scanDevices(): Promise<string[]>;
    connectPrinter(address: string): Promise<void>;
    disconnectPrinter(): Promise<void>;
    printText(text: string): Promise<void>;
  };

  export default BluetoothManager;
} 