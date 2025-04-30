import { userInstance } from '../middlewares/axios';
import { Sale, SalePayload } from '../interfaces/ISales';

export const salesApi = {
  fetchSales: async (): Promise<Sale[]> => {
    const response = await userInstance.get('api/sale/list-sales');
    return response.data?.sales || response.data || [];
  },

  fetchProducts: async () => {
    const response = await userInstance.get('api/product/products');
    return response.data?.products || response.data || [];
  },
  fetchListedProducts: async () => {
    const response = await userInstance.get('api/product/listed-products');
    return response.data?.products || response.data || [];
  },

  fetchCustomers: async () => {
    const response = await userInstance.get('api/customer/customers');
    return response.data?.customers || response.data || [];
  },
  fetchListedCustomers: async () => {
    const response = await userInstance.get('api/customer/listed-customers');
    return response.data?.customers || response.data || [];
  },

  addSale: async (payload: SalePayload) => {
    
    return await userInstance.post('api/sale/add-sale', payload);
  },

  updateSale: async (id: string, payload: SalePayload) => {

    return await userInstance.put(`api/sale/update-sale/${id}`, payload);
  },

  updatePaymentStatus: async (id: string, isPaid: boolean) => {
    return await userInstance.patch(`api/sale/is-paid/${id}`, { isPaid });
  },

  toggleActiveStatus: async (id: string ,isActive: boolean) => {
    return await userInstance.patch(`api/sale/is-active/${id}`,{isActive});
  }
};