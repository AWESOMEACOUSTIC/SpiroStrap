import { IDataSource } from "./IDataSource.js";

// Placeholder for future Web Bluetooth implementation.
export class WebBluetoothSource extends IDataSource {
  async connect() {
    throw new Error("WebBluetoothSource not implemented");
  }

  async disconnect() {
    throw new Error("WebBluetoothSource not implemented");
  }

  onSample(_callback) {
    throw new Error("WebBluetoothSource not implemented");
  }
}
