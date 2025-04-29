import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { message } from 'antd';
import { userInstance } from '../middlewares/axios';

interface Product {
  _id: string;
  productName: string;
  description: string;
  quantity: number;
  price: number;
}

interface EmailResponse {
  success: boolean;
  message: string;
}

declare module 'xlsx' {
  interface IUtils {
    book_new(): XLSX.WorkBook;
    json_to_sheet<T>(data: T[], opts?: XLSX.JSON2SheetOpts): XLSX.WorkSheet;
    book_append_sheet(workbook: XLSX.WorkBook, worksheet: XLSX.WorkSheet, name: string): void;
  }
}




export const exportToExcel = (products: Product[], fileName: string = 'Products'): void => {
  try {

    const exportData = products.map(product => ({
      'Product Name': product.productName,
      'Description': product.description,
      'Quantity': product.quantity,
      'Price': `$${product.price.toFixed(2)}`
    }));


    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(exportData);

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Products');

    XLSX.writeFile(workbook, `${fileName}.xlsx`);
  } catch (error) {
    console.error('Error exporting to Excel:', error);
    message.error('Failed to export to Excel');
  }
};


export const exportToPdf = (products: Product[], fileName: string = 'Products'): void => {
  try {
    const doc = new jsPDF();
    
    doc.setFontSize(16);
    doc.text('Products Report', 14, 15);

    const columns = [
      { header: 'Product Name', dataKey: 'productName' },
      { header: 'Description', dataKey: 'description' },
      { header: 'Quantity', dataKey: 'quantity' },
      { header: 'Price', dataKey: 'price' },
    ];
    

    const data = products.map(product => ({
      productName: product.productName,
      description: product.description.length > 30 ? product.description.substring(0, 30) + '...' : product.description,
      quantity: product.quantity,
      price: `$${product.price.toFixed(2)}`
    }));
    
    autoTable(doc, {
      columns,
      body: data,
      startY: 20,
      margin: { top: 20 },
      styles: { overflow: 'linebreak' },
      headStyles: { fillColor: [41, 128, 185], textColor: 255 }
    });

    doc.save(`${fileName}.pdf`);
  } catch (error) {
    console.error('Error exporting to PDF:', error);
    message.error('Failed to export to PDF');
  }
};


export const printData = (products: Product[]): void => {
  try {
    const printContent = document.createElement('div');
    
    const style = document.createElement('style');
    style.innerHTML = `
      .print-table {
        width: 100%;
        border-collapse: collapse;
        margin-bottom: 20px;
      }
      .print-table th, .print-table td {
        border: 1px solid #ddd;
        padding: 8px;
        text-align: left;
      }
      .print-table th {
        background-color: #f2f2f2;
        font-weight: bold;
      }
      .print-header {
        text-align: center;
        margin-bottom: 20px;
        font-size: 20px;
        font-weight: bold;
      }
    `;
    
    printContent.appendChild(style);
    
    const header = document.createElement('div');
    header.className = 'print-header';
    header.textContent = 'Products Report';
    printContent.appendChild(header);
    
    const table = document.createElement('table');
    table.className = 'print-table';
    
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    
    ['Product Name', 'Description', 'Quantity', 'Price'].forEach(text => {
      const th = document.createElement('th');
      th.textContent = text;
      headerRow.appendChild(th);
    });
    
    thead.appendChild(headerRow);
    table.appendChild(thead);
    
    const tbody = document.createElement('tbody');
    
    products.forEach(product => {
      const row = document.createElement('tr');
      
      const tdName = document.createElement('td');
      tdName.textContent = product.productName;
      row.appendChild(tdName);
      
      const tdDesc = document.createElement('td');
      tdDesc.textContent = product.description.length > 30 ? product.description.substring(0, 30) + '...' : product.description;
      row.appendChild(tdDesc);
      
      const tdQty = document.createElement('td');
      tdQty.textContent = product.quantity.toString();
      row.appendChild(tdQty);
      
      const tdPrice = document.createElement('td');
      tdPrice.textContent = `$${product.price.toFixed(2)}`;
      row.appendChild(tdPrice);
      
      tbody.appendChild(row);
    });
    
    table.appendChild(tbody);
    printContent.appendChild(table);
    
    const currentDate = new Date();
    const dateString = currentDate.toLocaleDateString();
    
    const footer = document.createElement('div');
    footer.style.textAlign = 'right';
    footer.style.marginTop = '20px';
    footer.textContent = `Generated on: ${dateString}`;
    printContent.appendChild(footer);
    
    document.body.appendChild(printContent);
    
    window.print();
    
    document.body.removeChild(printContent);
  } catch (error) {
    console.error('Error printing data:', error);
    message.error('Failed to print data');
  }
};


export const sendEmail = async (
  email: string,
  subject: string,
  emailMessage: string,
  products: Product[]
): Promise<void> => {
  try {
    const response = await userInstance.post<EmailResponse>('api/product/send-product-details', {
      email,
      subject,
      message: emailMessage,
      products
    });
    
    if (response.data.success) {
      message.success('Products data sent via email successfully');
    } else {
      message.error('Failed to send email');
    }
  } catch (error) {
    console.error('Error sending email:', error);
    message.error('Failed to send email');
    throw error;
  }
};