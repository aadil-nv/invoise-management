interface Product {
    _id: string;
    productName: string;
    description: string;
    quantity: number;
    price: number;
  }
  
  interface Customer {
    _id: string;
    name: string;
  }
  
  interface SaleProduct {
    productId: string | Product;  
    quantity: number;
    _id?: string;
  }
  
  type PaymentMethod = "Cash" | "Online" | "Credit Card" | "Debit Card" | "UPI" | "Bank Transfer";

export interface Sale {

    _id: string;
    products: SaleProduct[];
    customerId?: string | Customer;
    customerName?: string;
    paymentMethod: PaymentMethod;
    totalPrice: number;
    date: string;
  }