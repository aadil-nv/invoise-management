export interface CustomerAddress {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  }
  
  export interface Customer {
    _id: string;
    name: string;
    email: string;
    mobileNumber: string;
    address: CustomerAddress;
    isBlocked?: boolean | undefined;
  }
  
  export interface CustomerFormValues {
    name: string;
    email: string;
    mobileNumber: string;
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  }
  
  export interface EmailFormValues {
    recipient: string;
    subject: string;
    message: string;
  }