// src/types/saleTypes.ts

export interface Product {
    _id: string;
    productName: string;
    description: string;
    quantity: number;
    price: number;
  }
  
  export interface Customer {
    _id: string;
    name: string;
  }
  
  export interface SaleProduct {
    productId: string | Product;  // Can be either a string ID or a populated Product object
    quantity: number;
    _id?: string;
  }
  
  export type PaymentMethod = "Cash" | "Online" | "Credit Card" | "Debit Card" | "UPI" | "Bank Transfer";
  export type SaleStatus = "active" | "inactive";
  
  export interface Sale {
    _id: string;
    products: SaleProduct[];
    customerId?: string | Customer;  // Can be either a string ID or a populated Customer object
    customerName?: string;
    paymentMethod: PaymentMethod;
    totalPrice: number;
    subtotal?: number;
    tax?: number;
    date: string;
    isPaid: boolean;
    isActive: boolean;
  }
  
  export interface SalePayload {
    products: {
      productId: string;
      quantity: number;
    }[];
    customerId?: string;
    paymentMethod: PaymentMethod;
    totalPrice: number;
    subtotal?: number;
    tax?: number;
    date: string;
    isPaid: boolean;
    isActive?: boolean;
  }
  
  export interface EmailData {
    email: string;
    subject: string;
    message: string;
  }
  
  export type ExportFormat = 'excel' | 'pdf';