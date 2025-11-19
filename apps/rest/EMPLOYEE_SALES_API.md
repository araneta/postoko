# Employee Sales Tracking API

This document describes the employee sales tracking endpoints that have been implemented in the backend API.

## Overview

The employee sales tracking system provides three main endpoints to monitor and analyze employee sales performance:

1. **Sales Summary** - Get aggregated sales data for all employees
2. **Performance Comparison** - Compare employee performance metrics
3. **Individual Sales Details** - Get detailed sales history for a specific employee

## Authentication

All endpoints require authentication using Clerk JWT tokens. Only users with `admin` or `manager` roles can access these endpoints.

```http
Authorization: Bearer <clerk_jwt_token>
```

## Endpoints

### 1. GET /api/employees/sales

Get sales summary for all employees or filter by specific employee.

**Query Parameters:**
- `period` (optional): Time period for data aggregation
  - Values: `"week"`, `"month"`, `"year"`, `"today"`
  - Default: `"month"`
- `employeeId` (optional): Filter results for specific employee

**Example Requests:**
```http
GET /api/employees/sales?period=month
GET /api/employees/sales?period=week&employeeId=emp-123
```

**Response:**
```json
[
  {
    "employeeId": "emp-123",
    "employeeName": "John Doe",
    "employeeRole": "cashier",
    "totalSales": "1250.00",
    "orderCount": 25,
    "averageOrderValue": "50.00",
    "totalProfit": "375.00"
  }
]
```

### 2. GET /api/employees/sales/performance

Get performance comparison between all employees, ranked by sales performance.

**Query Parameters:**
- `period` (optional): Time period for performance analysis
  - Values: `"week"`, `"month"`, `"year"`, `"today"`
  - Default: `"month"`

**Example Request:**
```http
GET /api/employees/sales/performance?period=month
```

**Response:**
```json
[
  {
    "employeeId": "emp-123",
    "employeeName": "John Doe",
    "employeeRole": "cashier",
    "totalSales": "1250.00",
    "orderCount": 25,
    "averageOrderValue": "50.00",
    "totalProfit": "375.00",
    "profitMargin": 30.0
  }
]
```

### 3. GET /api/employees/{id}/sales

Get detailed sales history for a specific employee.

**Path Parameters:**
- `id` (required): Employee ID

**Query Parameters:**
- `period` (optional): Time period for sales history
  - Values: `"week"`, `"month"`, `"year"`, `"today"`
  - Default: `"month"`
- `limit` (optional): Maximum number of sales records to return
  - Default: `50`

**Example Request:**
```http
GET /api/employees/emp-123/sales?period=month&limit=20
```

**Response:**
```json
{
  "employee": {
    "id": "emp-123",
    "name": "John Doe",
    "email": "john@store.com",
    "role": "cashier"
  },
  "sales": [
    {
      "orderId": "order-456",
      "total": "75.50",
      "date": "2024-11-14T10:30:00Z",
      "paymentMethod": "cash",
      "itemCount": 3,
      "profit": "22.65"
    }
  ]
}
```

## Time Period Options

All endpoints support the following time period filters:

- **`today`**: Sales from the current day (00:00 to now)
- **`week`**: Sales from the last 7 days
- **`month`**: Sales from the current month (1st to now)
- **`year`**: Sales from the current year (January 1st to now)

## Response Data Fields

### Sales Summary Fields
- `employeeId`: Unique identifier for the employee
- `employeeName`: Full name of the employee
- `employeeRole`: Employee's role (admin, manager, cashier, staff)
- `totalSales`: Total sales amount for the period
- `orderCount`: Number of orders processed
- `averageOrderValue`: Average value per order
- `totalProfit`: Total profit generated (sales - costs)
- `profitMargin`: Profit margin percentage (profit/sales * 100)

### Sales Detail Fields
- `orderId`: Unique identifier for the order
- `total`: Total order amount
- `date`: Order date and time (ISO 8601 format)
- `paymentMethod`: Payment method used (cash, card, etc.)
- `itemCount`: Number of items in the order
- `profit`: Profit for this specific order

## Error Responses

### 401 Unauthorized
```json
{
  "message": "Unauthorized"
}
```

### 403 Forbidden
```json
{
  "message": "Forbidden"
}
```

### 404 Not Found
```json
{
  "message": "Employee not found"
}
```

### 500 Internal Server Error
```json
{
  "message": "Error fetching employee sales data"
}
```

## Usage Examples

### JavaScript/Node.js
```javascript
const fetch = require('node-fetch');

const API_BASE = 'http://localhost:3000/api';
const AUTH_TOKEN = 'your_clerk_jwt_token';

// Get monthly sales summary
async function getMonthlySales() {
  const response = await fetch(`${API_BASE}/employees/sales?period=month`, {
    headers: {
      'Authorization': `Bearer ${AUTH_TOKEN}`,
      'Content-Type': 'application/json'
    }
  });
  
  const data = await response.json();
  console.log('Monthly sales:', data);
}

// Get performance comparison
async function getPerformanceComparison() {
  const response = await fetch(`${API_BASE}/employees/sales/performance?period=week`, {
    headers: {
      'Authorization': `Bearer ${AUTH_TOKEN}`,
      'Content-Type': 'application/json'
    }
  });
  
  const data = await response.json();
  console.log('Performance comparison:', data);
}

// Get employee details
async function getEmployeeDetails(employeeId) {
  const response = await fetch(`${API_BASE}/employees/${employeeId}/sales?period=month&limit=10`, {
    headers: {
      'Authorization': `Bearer ${AUTH_TOKEN}`,
      'Content-Type': 'application/json'
    }
  });
  
  const data = await response.json();
  console.log('Employee details:', data);
}
```

### cURL Examples
```bash
# Get weekly sales summary
curl -X GET "http://localhost:3000/api/employees/sales?period=week" \
  -H "Authorization: Bearer your_jwt_token" \
  -H "Content-Type: application/json"

# Get performance comparison for current month
curl -X GET "http://localhost:3000/api/employees/sales/performance?period=month" \
  -H "Authorization: Bearer your_jwt_token" \
  -H "Content-Type: application/json"

# Get detailed sales for specific employee
curl -X GET "http://localhost:3000/api/employees/emp-123/sales?period=month&limit=20" \
  -H "Authorization: Bearer your_jwt_token" \
  -H "Content-Type: application/json"
```

## Testing

Use the provided test script to verify the endpoints:

```bash
# Run the test script
node test-employee-sales-endpoints.js

# With custom configuration
API_BASE_URL=http://localhost:3000 \
AUTH_TOKEN=your_jwt_token \
TEST_EMPLOYEE_ID=emp-123 \
node test-employee-sales-endpoints.js
```

## Database Schema

The endpoints use the following database tables:
- `employees` - Employee information
- `orders` - Order records with employee assignments
- `order_items` - Order line items with cost/profit data
- `roles` - Employee roles and permissions
- `store_info` - Store-specific data isolation

## Security Features

- **Authentication Required**: All endpoints require valid Clerk JWT tokens
- **Role-Based Access**: Only admin and manager roles can access sales data
- **Store Isolation**: Data is automatically filtered by store ownership
- **Input Validation**: Query parameters are validated and sanitized
- **SQL Injection Protection**: Uses parameterized queries via Drizzle ORM

## Performance Considerations

- **Indexed Queries**: Database queries use proper indexes on date and employee fields
- **Pagination**: Sales details endpoint supports limit parameter for large datasets
- **Efficient Joins**: Optimized SQL joins for performance
- **Caching**: Consider implementing Redis caching for frequently accessed data

## Future Enhancements

Potential improvements for the employee sales tracking system:

1. **Real-time Updates**: WebSocket support for live sales updates
2. **Advanced Analytics**: Trend analysis and forecasting
3. **Export Features**: CSV/PDF export of sales reports
4. **Dashboard Integration**: Frontend dashboard components
5. **Notifications**: Alerts for sales targets and performance milestones
6. **Commission Tracking**: Employee commission calculations
7. **Shift-based Reporting**: Sales tracking by work shifts
8. **Product Performance**: Employee performance by product categories