export interface MonthlySales {
    _id: string;
    totalSales: number;
    totalOrders: number;
  }
  
export interface TopProduct {
    _id: string;
    productName: string;
    description: string;
    quantity: number;
    price: number;
  }
  
export interface TopCustomer {
    _id: string;
    name: string;
    email: string;
    mobileNumber: string;
  }
  
  export interface DashboardData {
    totalCustomers: number;
    totalSales: number;
    totalProducts: number;
    totalRevenue: number;
    averageOrderValue: number;
    monthlySales: MonthlySales[];
    topProducts: TopProduct[];
    topCustomers: TopCustomer[];
  }
  
export interface ApiResponse {
    message: string;
    data: DashboardData;
  }
  
export  interface ChartDataPoint {
    month: string;
    monthKey: string; // For sorting
    sales: number;
    orders: number;
  }
  
  // Type for tooltip formatter
  export type TooltipFormatterCallback = (value: number, name: string) => [string, string];