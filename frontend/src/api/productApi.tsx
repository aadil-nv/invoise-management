import { Product, ProductDetailResponse, ProductResponse } from '../interfaces/IProduct';
import { userInstance } from '../middlewares/axios';






export const productApi = {
 
  listProducts: async (): Promise<ProductResponse> => {
  
      const response = await userInstance.get('api/product/products');
      return response.data;

  },


  addProduct: async (product: Omit<Product, '_id' | 'isListed'>): Promise<ProductDetailResponse> => {

      const response = await userInstance.post('api/product/add-product', product);
      return response.data;
  
  },


  updateProduct: async (id: string, product: Partial<Omit<Product, '_id'>>): Promise<ProductDetailResponse> => {

      const response = await userInstance.put(`api/product/update-product/${id}`, product);
      return response.data;

  },


   toggleProductListing: async (id: string): Promise<ProductDetailResponse> => {

      const response = await userInstance.patch(`api/product/is-listed/${id}`);
      return response.data;

  },

  getProductDetails: async (id: string): Promise<ProductDetailResponse> => {

      const response = await userInstance.get(`api/product/get-product/${id}`);
      return response.data;

  }
};