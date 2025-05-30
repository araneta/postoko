import * as SQLite from 'expo-sqlite';
import { Product, Order, Settings } from '../types';

const db = SQLite.openDatabase('pos.db');

export const initDatabase = () => {
  return new Promise<void>((resolve, reject) => {
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
    error => reject(error),
    () => resolve());
  });
};

export const getProducts = (): Promise<Product[]> => {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        'SELECT * FROM products;',
        [],
        (_, { rows: { _array } }) => resolve(_array),
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
        () => resolve(),
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
        () => resolve(),
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
    db.transaction(tx => {
      tx.executeSql(
        'DELETE FROM products WHERE id = ?;',
        [id],
        () => resolve(),
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
    db.transaction(tx => {
      tx.executeSql(
        'SELECT * FROM orders ORDER BY date DESC;',
        [],
        (_, { rows: { _array } }) => {
          const orders = _array.map(order => ({
            ...order,
            items: JSON.parse(order.items)
          }));
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
        () => resolve(),
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
    db.transaction(tx => {
      tx.executeSql(
        'SELECT * FROM settings WHERE id = 1;',
        [],
        (_, { rows: { _array } }) => {
          if (_array.length > 0) {
            const settings = _array[0];
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
              printer: { type: 'none' }
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
    db.transaction(tx => {
      tx.executeSql(
        `UPDATE settings 
         SET currency = ?, printer = ?, store_info = ?
         WHERE id = 1;`,
        [
          JSON.stringify(settings.currency),
          JSON.stringify(settings.printer),
          JSON.stringify(settings.storeInfo || {})
        ],
        () => resolve(),
        (_, error) => {
          reject(error);
          return false;
        }
      );
    });
  });
};