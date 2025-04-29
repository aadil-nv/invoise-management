export interface Product {
  _id: string;
  productName: string;
  description: string;
  quantity: number;
  price: number;
  isListed: boolean;
}

export interface EmailFormValues {
  email: string;
  subject: string;
  message: string;
}

export interface ProductResponse {
  products: Product[];
  success: boolean;
  message: string;
}

export interface ProductDetailResponse {
  product: Product;
  success: boolean;
  message: string;
}