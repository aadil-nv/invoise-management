import {  FormInstance } from 'antd';


export interface EmailExportModalProps {
    visible: boolean;
    onCancel: () => void;
    form: FormInstance;
    onFinish: (values: EmailFormValues) => void;
    loading: boolean;
  }
  
  export interface EmailFormValues {
    recipient: string;
    subject: string;
    message: string;
  }