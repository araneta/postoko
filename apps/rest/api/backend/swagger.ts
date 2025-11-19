import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { Express } from 'express';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Express API',
      version: '1.0.0',
      description: 'A comprehensive API for managing products, orders, customers, and more',
    },
    servers: [
      {
        url: process.env.NODE_ENV === 'production' ? 'https://your-domain.com' : 'http://localhost:3000',
        description: process.env.NODE_ENV === 'production' ? 'Production server' : 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        ClerkAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Clerk authentication token',
        },
      },
      schemas: {
        Product: {
          type: 'object',
          required: ['name', 'price'],
          properties: {
            id: {
              type: 'string',
              description: 'Product ID',
            },
            name: {
              type: 'string',
              description: 'Product name',
            },
            price: {
              type: 'number',
              description: 'Product price',
            },
            description: {
              type: 'string',
              description: 'Product description',
            },
            categoryId: {
              type: 'integer',
              description: 'Product category ID',
            },
            categoryName: {
              type: 'string',
              description: 'Product category name',
            },
            stock: {
              type: 'number',
              description: 'Stock quantity',
            },
            image_url: {
              type: 'string',
              description: 'Product image URL',
            },
          },
        },
        Order: {
          type: 'object',
          required: ['customer_id', 'items', 'total'],
          properties: {
            id: {
              type: 'string',
              description: 'Order ID',
            },
            customer_id: {
              type: 'string',
              description: 'Customer ID',
            },
            items: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  product_id: { type: 'string' },
                  quantity: { type: 'number' },
                  price: { type: 'number' },
                },
              },
            },
            total: {
              type: 'number',
              description: 'Order total amount',
            },
            status: {
              type: 'string',
              enum: ['pending', 'processing', 'completed', 'cancelled'],
              description: 'Order status',
            },
            created_at: {
              type: 'string',
              format: 'date-time',
              description: 'Order creation timestamp',
            },
          },
        },
        Category: {
          type: 'object',
          required: ['name'],
          properties: {
            id: {
              type: 'integer',
              description: 'Category ID',
            },
            storeInfoId: {
              type: 'integer',
              description: 'Store ID',
            },
            name: {
              type: 'string',
              description: 'Category name',
            },
            description: {
              type: 'string',
              description: 'Category description',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Category creation timestamp',
            },
          },
        },
        Customer: {
          type: 'object',
          required: ['name', 'email'],
          properties: {
            id: {
              type: 'string',
              description: 'Customer ID',
            },
            name: {
              type: 'string',
              description: 'Customer name',
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'Customer email',
            },
            phone: {
              type: 'string',
              description: 'Customer phone number',
            },
            loyalty_points: {
              type: 'number',
              description: 'Customer loyalty points',
            },
          },
        },
        Employee: {
          type: 'object',
          required: ['name', 'email', 'role'],
          properties: {
            id: {
              type: 'string',
              description: 'Employee ID',
            },
            name: {
              type: 'string',
              description: 'Employee name',
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'Employee email',
            },
            role: {
              type: 'string',
              description: 'Employee role',
            },
            hire_date: {
              type: 'string',
              format: 'date',
              description: 'Employee hire date',
            },
          },
        },
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'Error message',
            },
            message: {
              type: 'string',
              description: 'Detailed error description',
            },
          },
        },
      },
    },
    security: [
      {
        ClerkAuth: [],
      },
    ],
  },
  apis: ['./api/backend/routes/*.ts'], // Path to the API files
};

const specs = swaggerJsdoc(options);

export const setupSwagger = (app: Express): void => {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, {
    explorer: true,
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'Express API Documentation',
  }));
};

export default specs;