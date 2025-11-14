# Employee Sales Tracking Feature

## Overview
This feature enables store managers and administrators to track sales performance by individual employees. It provides comprehensive analytics including sales totals, order counts, profit margins, and performance comparisons.

## Database Schema
The feature leverages the existing database structure:
- `ordersTable.employeeId` - Links orders to employees
- `employeesTable` - Employee information and roles
- `orderItemsTable` - Order details with unit prices and costs
- Role-based access control through `rolesTable`

## API Endpoints

### 1. Employee Sales Summary
**GET** `/api/employees/sales`

Get sales summary for all employees or a specific employee.

**Query Parameters:**
- `period` (optional): Time period filter
  - `today` - Today's sales
  - `week` - Last 7 days
  - `month` - Current month (default)
  - `year` - Current year
- `employeeId` (optional): Filter by specific employee ID

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

### 2. Employee Performance Comparison
**GET** `/api/employees/sales/performance`

Compare performance metrics across all employees.

**Query Parameters:**
- `period` (optional): Same as above

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

### 3. Employee Sales Details
**GET** `/api/employees/{employeeId}/sales`

Get detailed sales history for a specific employee.

**Query Parameters:**
- `period` (optional): Time period filter
- `limit` (optional): Number of orders to return (default: 50)

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

## Key Features

### 1. Comprehensive Metrics
- **Total Sales**: Sum of all completed orders
- **Order Count**: Number of transactions processed
- **Average Order Value**: Mean transaction amount
- **Total Profit**: Calculated from unit prices vs costs
- **Profit Margin**: Percentage profit on sales

### 2. Flexible Time Periods
- Today's performance
- Weekly trends (last 7 days)
- Monthly summaries (current month)
- Yearly overviews (current year)

### 3. Security & Access Control
- Authentication required for all endpoints
- Role-based access (admin/manager only)
- Store-specific data isolation
- Soft-deleted employees excluded

### 4. Performance Optimization
- Efficient SQL queries with proper joins
- Grouped aggregations for summary data
- Indexed lookups on employee and store IDs
- Limited result sets to prevent performance issues

## Implementation Details

### Controller Methods
1. `getEmployeeSales()` - Sales summary with aggregations
2. `getEmployeeSalesDetails()` - Detailed order history
3. `getEmployeePerformanceComparison()` - Cross-employee comparison

### Database Queries
- Uses Drizzle ORM for type-safe queries
- Leverages SQL aggregation functions (SUM, COUNT, AVG)
- Implements proper JOIN operations for related data
- Includes profit calculations using subqueries

### Error Handling
- Validates user authentication and authorization
- Checks store information existence
- Handles missing employee records
- Provides meaningful error messages

## Usage Examples

### Frontend Integration
```javascript
// Get monthly sales for all employees
const response = await fetch('/api/employees/sales?period=month', {
  headers: { 'Authorization': `Bearer ${token}` }
});
const salesData = await response.json();

// Get detailed sales for specific employee
const employeeDetails = await fetch(`/api/employees/${employeeId}/sales?period=week`, {
  headers: { 'Authorization': `Bearer ${token}` }
});
const details = await employeeDetails.json();
```

### Dashboard Metrics
- Top performing employees by sales volume
- Employee efficiency (orders per hour/day)
- Profit contribution by employee
- Sales trends over time periods

## Future Enhancements

### Potential Additions
1. **Commission Calculations**: Based on sales performance
2. **Goal Tracking**: Set and monitor sales targets
3. **Time-based Analytics**: Peak hours by employee
4. **Product Performance**: Best-selling items per employee
5. **Customer Metrics**: Repeat customers served
6. **Shift-based Tracking**: Performance by work shifts

### Advanced Features
- Export capabilities (CSV, PDF reports)
- Real-time notifications for milestones
- Comparative analytics (vs previous periods)
- Predictive performance modeling
- Integration with payroll systems

## Testing

Use the provided `test-employee-sales.js` script to understand the API structure and test the endpoints. The script includes example requests and expected response formats.

## Dependencies

- Express.js for routing
- Drizzle ORM for database operations
- Clerk for authentication
- PostgreSQL for data storage

## Notes

- All monetary values are stored as NUMERIC(10,2) for precision
- Dates are stored as VARCHAR but converted to timestamps for queries
- Profit calculations require product cost data to be accurate
- Performance data excludes refunded orders (status = 'completed' only)