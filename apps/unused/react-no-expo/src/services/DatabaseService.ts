import SQLite from 'react-native-sqlite-storage';
import {Product, Order, Settings} from '../types';

SQLite.DEBUG(true);
SQLite.enablePromise(true);

const database_name = 'pos.db';
const database_version = '1.0';
const database_displayname = 'POS Database';
const database_size = 200000;

class DatabaseServiceClass {
  private db: SQLite.SQLiteDatabase | null = null;

  async initDatabase(): Promise<void> {
    try {
      this.db = await SQLite.openDatabase(
        database_name,
        database_version,
        database_displayname,
        database_size,
      );

      await this.createTables();
      console.log('Database initialized successfully');
    } catch (error) {
      console.error('Database initialization failed:', error);
      throw error;
    }
  }

  private async createTables(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const createProductsTable = `
      CREATE TABLE IF NOT EXISTS products (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        price REAL NOT NULL,
        stock INTEGER NOT NULL,
        category TEXT,
        description TEXT,
        image TEXT
      );
    `;

    const createOrdersTable = `
      CREATE TABLE IF NOT EXISTS orders (
        id TEXT PRIMARY KEY,
        items TEXT NOT NULL,
        total REAL NOT NULL,
        date TEXT NOT NULL,
        payment_method TEXT NOT NULL,
        status TEXT NOT NULL
      );
    `;

    const createSettingsTable = `
      CREATE TABLE IF NOT EXISTS settings (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        currency TEXT NOT NULL,
        printer TEXT,
        store_info TEXT
      );
    `;

    await this.db.executeSql(createProductsTable);
    await this.db.executeSql(createOrdersTable);
    await this.db.executeSql(createSettingsTable);

    // Insert default settings if not exists
    const defaultSettings = {
      currency: {code: 'USD', symbol: '$', name: 'US Dollar'},
      printer: {type: 'none'},
      storeInfo: {},
    };

    await this.db.executeSql(
      `INSERT OR IGNORE INTO settings (id, currency, printer, store_info)
       VALUES (?, ?, ?, ?);`,
      [
        1,
        JSON.stringify(defaultSettings.currency),
        JSON.stringify(defaultSettings.printer),
        JSON.stringify(defaultSettings.storeInfo),
      ],
    );
  }

  async getProducts(): Promise<Product[]> {
    if (!this.db) throw new Error('Database not initialized');

    const [results] = await this.db.executeSql('SELECT * FROM products;');
    const products: Product[] = [];

    for (let i = 0; i < results.rows.length; i++) {
      products.push(results.rows.item(i));
    }

    return products;
  }

  async addProduct(product: Product): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    await this.db.executeSql(
      `INSERT INTO products (id, name, price, stock, category, description, image)
       VALUES (?, ?, ?, ?, ?, ?, ?);`,
      [
        product.id,
        product.name,
        product.price,
        product.stock,
        product.category,
        product.description || '',
        product.image || '',
      ],
    );
  }

  async updateProduct(product: Product): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    await this.db.executeSql(
      `UPDATE products 
       SET name = ?, price = ?, stock = ?, category = ?, description = ?, image = ?
       WHERE id = ?;`,
      [
        product.name,
        product.price,
        product.stock,
        product.category,
        product.description || '',
        product.image || '',
        product.id,
      ],
    );
  }

  async deleteProduct(id: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    await this.db.executeSql('DELETE FROM products WHERE id = ?;', [id]);
  }

  async getOrders(): Promise<Order[]> {
    if (!this.db) throw new Error('Database not initialized');

    const [results] = await this.db.executeSql(
      'SELECT * FROM orders ORDER BY date DESC;',
    );
    const orders: Order[] = [];

    for (let i = 0; i < results.rows.length; i++) {
      const row = results.rows.item(i);
      orders.push({
        ...row,
        items: JSON.parse(row.items),
        paymentMethod: row.payment_method,
      });
    }

    return orders;
  }

  async addOrder(order: Order): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    await this.db.executeSql(
      `INSERT INTO orders (id, items, total, date, payment_method, status)
       VALUES (?, ?, ?, ?, ?, ?);`,
      [
        order.id,
        JSON.stringify(order.items),
        order.total,
        order.date,
        order.paymentMethod,
        order.status,
      ],
    );
  }

  async getSettings(): Promise<Settings> {
    if (!this.db) throw new Error('Database not initialized');

    const [results] = await this.db.executeSql(
      'SELECT * FROM settings WHERE id = 1;',
    );

    if (results.rows.length > 0) {
      const settings = results.rows.item(0);
      return {
        currency: JSON.parse(settings.currency),
        printer: JSON.parse(settings.printer),
        storeInfo: JSON.parse(settings.store_info || '{}'),
      };
    }

    // Return default settings if none found
    return {
      currency: {code: 'USD', symbol: '$', name: 'US Dollar'},
      printer: {type: 'none'},
      storeInfo: {},
    };
  }

  async updateSettings(settings: Settings): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    await this.db.executeSql(
      `UPDATE settings 
       SET currency = ?, printer = ?, store_info = ?
       WHERE id = 1;`,
      [
        JSON.stringify(settings.currency),
        JSON.stringify(settings.printer),
        JSON.stringify(settings.storeInfo || {}),
      ],
    );
  }
}

export const DatabaseService = new DatabaseServiceClass();