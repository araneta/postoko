import * as SQLite from 'expo-sqlite';
import { Product, Order, Settings } from '../types';

interface SQLiteDatabase {
  transaction: (callback: (tx: any) => void, errorCallback?: (error: Error) => void, successCallback?: () => void) => void;
}

let db: SQLiteDatabase | null = null;

interface SQLiteResult {
  rows: {
    _array: any[];
    length: number;
    item: (index: number) => any;
  };
}

export const initDatabase = async () => {
  if (!db) {
    const database = await SQLite.openDatabaseAsync('pos.db');
    db = database as unknown as SQLiteDatabase;
  }

  return new Promise<void>((resolve, reject) => {
    if (!db) {
      reject(new Error('Database not initialized'));
      return;
    }

    db.transaction(tx => {
      // Create products table
      tx.executeSql(
        `CREATE TABLE IF NOT EXISTS products (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          price REAL NOT NULL,
          stock INTEGER NOT NULL,
          category TEXT,
          description TEXT,
          image TEXT
        );`
      );

      // Create orders table
      tx.executeSql(
        `CREATE TABLE IF NOT EXISTS orders (
          id TEXT PRIMARY KEY,
          items TEXT NOT NULL,
          total REAL NOT NULL,
          date TEXT NOT NULL,
          payment_method TEXT NOT NULL,
          status TEXT NOT NULL
        );`
      );

      // Create settings table
      tx.executeSql(
        `CREATE TABLE IF NOT EXISTS settings (
          id INTEGER PRIMARY KEY CHECK (id = 1),
          currency TEXT NOT NULL,
          printer TEXT,
          store_info TEXT
        );`
      );

      // Insert default settings if not exists
      tx.executeSql(
        `INSERT OR IGNORE INTO settings (id, currency, printer, store_info)
         VALUES (?, ?, ?, ?);`,
        [1, JSON.stringify({
          code: 'USD',
          symbol: '$',
          name: 'US Dollar'
        }), JSON.stringify({ type: 'none' }), '{}']
      );
    }, 
    error => {
      reject(error);
    },
    () => {
      resolve();
    });
  });
};

export const getProducts = (): Promise<Product[]> => {
  return new Promise((resolve, reject) => {
    if (!db) {
      reject(new Error('Database not initialized'));
      return;
    }

    db.transaction(tx => {
      tx.executeSql(
        'SELECT * FROM products;',
        [],
        (_, result: SQLiteResult) => {
          resolve(result.rows._array as Product[]);
        },
        (_, error) => {
          reject(error);
          return false;
        }
      );
    });
  });
};

export const addProduct = (product: Product): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (!db) {
      reject(new Error('Database not initialized'));
      return;
    }

    db.transaction(tx => {
      tx.executeSql(
        `INSERT INTO products (id, name, price, stock, category, description, image)
         VALUES (?, ?, ?, ?, ?, ?, ?);`,
        [
          product.id,
          product.name,
          product.price,
          product.stock,
          product.category,
          product.description,
          product.image
        ],
        () => {
          resolve();
        },
        (_, error) => {
          reject(error);
          return false;
        }
      );
    });
  });
};

export const updateProduct = (product: Product): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (!db) {
      reject(new Error('Database not initialized'));
      return;
    }

    db.transaction(tx => {
      tx.executeSql(
        `UPDATE products 
         SET name = ?, price = ?, stock = ?, category = ?, description = ?, image = ?
         WHERE id = ?;`,
        [
          product.name,
          product.price,
          product.stock,
          product.category,
          product.description,
          product.image,
          product.id
        ],
        () => {
          resolve();
        },
        (_, error) => {
          reject(error);
          return false;
        }
      );
    });
  });
};

export const deleteProduct = (id: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (!db) {
      reject(new Error('Database not initialized'));
      return;
    }

    db.transaction(tx => {
      tx.executeSql(
        'DELETE FROM products WHERE id = ?;',
        [id],
        () => {
          resolve();
        },
        (_, error) => {
          reject(error);
          return false;
        }
      );
    });
  });
};

export const getOrders = (): Promise<Order[]> => {
  return new Promise((resolve, reject) => {
    if (!db) {
      reject(new Error('Database not initialized'));
      return;
    }

    db.transaction(tx => {
      tx.executeSql(
        'SELECT * FROM orders ORDER BY date DESC;',
        [],
        (_, result: SQLiteResult) => {
          const orders = result.rows._array.map(order => ({
            ...order,
            items: JSON.parse(order.items)
          })) as Order[];
          resolve(orders);
        },
        (_, error) => {
          reject(error);
          return false;
        }
      );
    });
  });
};

export const addOrder = (order: Order): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (!db) {
      reject(new Error('Database not initialized'));
      return;
    }

    db.transaction(tx => {
      tx.executeSql(
        `INSERT INTO orders (id, items, total, date, payment_method, status)
         VALUES (?, ?, ?, ?, ?, ?);`,
        [
          order.id,
          JSON.stringify(order.items),
          order.total,
          order.date,
          order.paymentMethod,
          order.status
        ],
        () => {
          resolve();
        },
        (_, error) => {
          reject(error);
          return false;
        }
      );
    });
  });
};

export const getSettings = (): Promise<Settings> => {
  return new Promise((resolve, reject) => {
    if (!db) {
      reject(new Error('Database not initialized'));
      return;
    }

    db.transaction(tx => {
      tx.executeSql(
        'SELECT * FROM settings WHERE id = 1;',
        [],
        (_, result: SQLiteResult) => {
          if (result.rows.length > 0) {
            const settings = result.rows.item(0);
            resolve({
              currency: JSON.parse(settings.currency),
              printer: JSON.parse(settings.printer),
              storeInfo: JSON.parse(settings.store_info)
            });
          } else {
            resolve({
              currency: {
                code: 'USD',
                symbol: '$',
                name: 'US Dollar'
              },
              printer: { type: 'none' },
              storeInfo: {}
            });
          }
        },
        (_, error) => {
          reject(error);
          return false;
        }
      );
    });
  });
};

export const updateSettings = (settings: Settings): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (!db) {
      reject(new Error('Database not initialized'));
      return;
    }

    db.transaction(tx => {
      tx.executeSql(
        `UPDATE settings 
         SET currency = ?, printer = ?, store_info = ?
         WHERE id = 1;`,
        [
          JSON.stringify(settings.currency),
          JSON.stringify(settings.printer),
          JSON.stringify(settings.storeInfo)
        ],
        () => {
          resolve();
        },
        (_, error) => {
          reject(error);
          return false;
        }
      );
    });
  });
};