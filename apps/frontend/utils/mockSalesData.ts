import { EmployeeSales, EmployeePerformance, EmployeeSalesDetail } from '../types';

// Mock data generator for testing employee sales features
export const generateMockEmployeeSales = (count: number = 5): EmployeeSales[] => {
  const roles = ['cashier', 'sales associate', 'manager', 'supervisor'];
  const names = ['John Doe', 'Jane Smith', 'Mike Johnson', 'Sarah Wilson', 'David Brown', 'Lisa Davis', 'Tom Anderson', 'Emily Taylor'];
  
  return Array.from({ length: count }, (_, index) => {
    const totalSales = Math.random() * 5000 + 1000; // $1000-$6000
    const orderCount = Math.floor(Math.random() * 50) + 10; // 10-60 orders
    const totalProfit = totalSales * (0.2 + Math.random() * 0.3); // 20-50% profit margin
    
    return {
      employeeId: `emp-${index + 1}`,
      employeeName: names[index % names.length],
      employeeRole: roles[index % roles.length],
      totalSales: totalSales.toFixed(2),
      orderCount,
      averageOrderValue: (totalSales / orderCount).toFixed(2),
      totalProfit: totalProfit.toFixed(2),
      profitMargin: (totalProfit / totalSales) * 100,
    };
  });
};

export const generateMockEmployeePerformance = (count: number = 5): EmployeePerformance[] => {
  const salesData = generateMockEmployeeSales(count);
  
  return salesData
    .sort((a, b) => parseFloat(b.totalSales) - parseFloat(a.totalSales))
    .map((emp, index) => ({
      ...emp,
      period: 'week',
      rank: index + 1,
    }));
};

export const generateMockEmployeeSalesDetail = (employeeId: string): { employee: EmployeeSales; sales: EmployeeSalesDetail[] } => {
  const employee = generateMockEmployeeSales(1)[0];
  employee.employeeId = employeeId;
  
  const salesCount = Math.floor(Math.random() * 20) + 10; // 10-30 sales
  const sales: EmployeeSalesDetail[] = Array.from({ length: salesCount }, (_, index) => {
    const total = Math.random() * 200 + 20; // $20-$220
    const profit = total * (0.2 + Math.random() * 0.3); // 20-50% profit
    const itemCount = Math.floor(Math.random() * 5) + 1; // 1-6 items
    
    const date = new Date();
    date.setDate(date.getDate() - index);
    
    return {
      orderId: `order-${Date.now()}-${index}`,
      date: date.toISOString(),
      total: total.toFixed(2),
      profit: profit.toFixed(2),
      items: Array.from({ length: itemCount }, (_, i) => ({
        id: `item-${i}`,
        name: `Product ${i + 1}`,
        price: Math.random() * 50 + 10,
        cost: Math.random() * 30 + 5,
        stock: Math.floor(Math.random() * 100),
        category: 'General',
        quantity: Math.floor(Math.random() * 3) + 1,
      })),
    };
  });
  
  return { employee, sales };
};

// Test function to validate API response structure
export const validateEmployeeSalesResponse = (data: any): boolean => {
  if (!Array.isArray(data)) return false;
  
  return data.every(item => 
    typeof item.employeeId === 'string' &&
    typeof item.employeeName === 'string' &&
    typeof item.employeeRole === 'string' &&
    typeof item.totalSales === 'string' &&
    typeof item.orderCount === 'number' &&
    typeof item.averageOrderValue === 'string' &&
    typeof item.totalProfit === 'string' &&
    typeof item.profitMargin === 'number'
  );
};