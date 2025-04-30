import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Table, Button, Modal, Form, Input, Select, DatePicker, Pagination, 
  Space, InputNumber, Menu, Dropdown, message, Tag
} from 'antd';
import { 
  SearchOutlined, PlusOutlined, EditOutlined, 
  DownloadOutlined, FileExcelOutlined, FilePdfOutlined, 
  PrinterOutlined, MailOutlined, CheckCircleOutlined, CloseCircleOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { toast } from 'react-toastify';
import { AxiosError } from 'axios';
import { salesApi } from '../../api/salesApi';
import { 
  Sale, Product, Customer, SaleProduct, 
  ExportFormat, EmailData
} from '../../interfaces/ISales';
import { 
  exportToExcel, 
  exportToPdf, 
  printSalesData, 
  sendSalesReportEmail
} from '../../utils/SalesFunctions';

export function Sales() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [filteredSales, setFilteredSales] = useState<Sale[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [listedProductData, setListedProductData] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [listedCustomers, setListedCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [searchText, setSearchText] = useState<string>('');
  const [isModalVisible, setIsModalVisible] = useState<boolean>(false);
  const [isEditMode, setIsEditMode] = useState<boolean>(false);
  const [currentSale, setCurrentSale] = useState<Sale | null>(null);
  const [form] = Form.useForm();
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [isEmailModalVisible, setIsEmailModalVisible] = useState<boolean>(false);
  const [emailForm] = Form.useForm();
  const [exportFormat, setExportFormat] = useState<ExportFormat>('pdf');
  const pageSize = 5;

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    filterSales();
  }, [sales, searchText]);

  const fetchData = async (): Promise<void> => {
    setLoading(true);
    try {
      const [salesData, productsData, customersData, listedProductsData, listedCustomersData] = await Promise.all([
        salesApi.fetchSales(),
        salesApi.fetchProducts(),
        salesApi.fetchCustomers(),
        salesApi.fetchListedProducts(),
        salesApi.fetchListedCustomers()
      ]);
      
      setSales(Array.isArray(salesData) ? salesData : []);
      setProducts(Array.isArray(productsData) ? productsData : []);
      setCustomers(Array.isArray(customersData) ? customersData : []);
      setListedProductData(Array.isArray(listedProductsData) ? listedProductsData : []);
      setListedCustomers(Array.isArray(listedCustomersData) ? listedCustomersData : []);
      console.log(products.map((d)=>d._id));
      console.log(customers.map((c)=>c._id));
      
    } catch (error) {
      toast.error('Failed to fetch data');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const filterSales = (): void => {
    if (!Array.isArray(sales)) {
      setFilteredSales([]);
      return;
    }
    
    if (!searchText) {
      setFilteredSales(sales);
      return;
    }

    const filtered = sales.filter(sale => {
      // Check for customer name
      const customerName = sale.customerId && typeof sale.customerId === 'object' && 'name' in sale.customerId 
        ? sale.customerId.name.toLowerCase() 
        : '';
      
      if (
        customerName.includes(searchText.toLowerCase()) ||
        sale.paymentMethod.toLowerCase().includes(searchText.toLowerCase()) ||
        (sale.isPaid ? 'paid' : 'unpaid').includes(searchText.toLowerCase()) ||
        (sale.isActive ? 'active' : 'inactive').includes(searchText.toLowerCase())
      ) {
        return true;
      }
      
      return sale.products.some(p => {
        let productName = '';
        
        if (typeof p.productId === 'object' && p.productId && 'productName' in p.productId) {
          productName = p.productId.productName || '';
        }
        
        return productName.toLowerCase().includes(searchText.toLowerCase());
      });
    });
    
    setFilteredSales(filtered);
  };

  const showAddModal = (): void => {
    setIsEditMode(false);
    setCurrentSale(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const showEditModal = (sale: Sale): void => {
    setIsEditMode(true);
    setCurrentSale(sale);
    
    const formattedProducts = sale.products.map(p => {
      let productId;
      let productName = '';
      
      if (typeof p.productId === 'object' && p.productId && '_id' in p.productId) {
        productId = p.productId._id;
        productName = p.productId.productName || '';
      } else {
        productId = p.productId;
      }
      
      return {
        productId,
        productName,
        quantity: p.quantity,
      };
    });
    
    let customerId;
    let customerName = '';
    
    if (typeof sale.customerId === 'object' && sale.customerId && '_id' in sale.customerId) {
      customerId = sale.customerId._id;
      customerName = sale.customerId.name || '';
    } else {
      customerId = sale.customerId;
    }
    
    form.setFieldsValue({
      customerId,
      customerName,
      paymentMethod: sale.paymentMethod,
      subtotal: sale.subtotal || sale.totalPrice / 1.1, 
      tax: sale.tax || sale.totalPrice * 0.1, 
      totalPrice: sale.totalPrice,
      date: dayjs(sale.date),
      products: formattedProducts,
      isPaid: sale.isPaid !== undefined ? sale.isPaid : false,
      isActive: sale.isActive !== undefined ? (sale.isActive ? 'active' : 'inactive') : 'active',
    });
    
    setIsModalVisible(true);
  };

  const handleCancel = (): void => {
    setIsModalVisible(false);
    form.resetFields();
  };

  const handleAddProduct = (): void => {
    const currentProducts = form.getFieldValue('products') || [];
    form.setFieldsValue({
      products: [...currentProducts, { productId: undefined, quantity: 1 }]
    });
  };

  const calculateSubtotalAndTax = (): { subtotal: number, tax: number, total: number } => {
    const formProducts = form.getFieldValue('products') || [];
    let subtotal = 0;
    
    formProducts.forEach((item: { productId?: string, quantity?: number }) => {
      if (item.productId && item.quantity) {
        const product = listedProductData.find(p => p._id === item.productId);
        if (product) {
          subtotal += product.price * item.quantity;
        }
      }
    });
    
    const tax = subtotal * 0.1;
    const total = subtotal + tax;
    
    return { subtotal, tax, total };
  };

  const updatePrices = (): void => {
    const { subtotal, tax, total } = calculateSubtotalAndTax();
    form.setFieldsValue({ 
      subtotal, 
      tax,
      totalPrice: total 
    });
  };

  const handleSubmit = async (): Promise<void> => {
    try {
      const values = await form.validateFields();
  
      const payload = {
        ...values,
        date: values.date.format('YYYY-MM-DD'),
        products: values.products.map((p: { productId: string; quantity: number }) => ({
          productId: p.productId,
          quantity: p.quantity,
        })),
        isPaid: values.isPaid,
        isActive: values.isActive === 'active',
        subtotal: values.subtotal,
        tax: values.tax
      };
  
      if (isEditMode && currentSale) {
        await salesApi.updateSale(currentSale._id, payload);
        toast.success('Sale updated successfully');
      } else {
        await salesApi.addSale(payload);
        toast.success('Sale added successfully');
      }
  
      setIsModalVisible(false);
      form.resetFields();
      fetchData();
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        toast.error(error.response?.data.message||error.response?.data.errors[0].msg || 'Failed to save sale');
      }
    }
  };

  const handleUpdatePaymentStatus = async (saleId: string, isPaid: boolean): Promise<void> => {
    try {
      await salesApi.updatePaymentStatus(saleId, isPaid);
      toast.success(`Payment status updated successfully`);
      fetchData();
    } catch (error) {
      toast.error('Failed to update payment status');
      console.error(error);
    }
  };
  

  const handleToggleActiveStatus = async (saleId: string, isActive: boolean): Promise<void> => {
    try {
      await salesApi.toggleActiveStatus(saleId, isActive);
      toast.success('Sale status updated successfully');
      fetchData();
    } catch (error) {
      toast.error('Failed to update sale status');
      console.error(error);
    }
  };

  const handleExportExcel = (): void => {
    try {
      exportToExcel(filteredSales, `sales-report-${dayjs().format('YYYY-MM-DD')}`);
      message.success('Sales report exported to Excel successfully');
    } catch (error) {
      message.error('Failed to export Excel file');
      console.error(error);
    }
  };

  const handleExportPdf = (): void => {
    try {
      exportToPdf(filteredSales, `sales-report-${dayjs().format('YYYY-MM-DD')}`);
      message.success('Sales report exported to PDF successfully');
    } catch (error) {
      message.error('Failed to export PDF file');
      console.error(error);
    }
  };

  const handlePrint = (): void => {
    try {
      printSalesData(filteredSales);
    } catch (error) {
      message.error('Failed to print sales report');
      console.error(error);
    }
  };

  const showEmailModal = (format: ExportFormat): void => {
    setExportFormat(format);
    emailForm.resetFields();
    emailForm.setFieldsValue({
      subject: `Sales Report - ${dayjs().format('YYYY-MM-DD')}`,
      message: `Please find attached the sales report generated on ${dayjs().format('YYYY-MM-DD')}.`
    });
    setIsEmailModalVisible(true);
  };

  const handleEmailSubmit = async (): Promise<void> => {
    try {
      const values = await emailForm.validateFields();
      const emailData: EmailData = {
        email: values.email,
        subject: values.subject,
        message: values.message
      };
      
      await sendSalesReportEmail(filteredSales, emailData, exportFormat);
      
      setIsEmailModalVisible(false);
      emailForm.resetFields();
      message.success(`Sales report sent to ${emailData.email} successfully`);
    } catch (error) {
      message.error('Failed to send email');
      console.error(error);
    }
  };


  const exportMenu = (
    <Menu>
      <Menu.Item key="excel" icon={<FileExcelOutlined />} onClick={handleExportExcel}>
        Export as Excel
      </Menu.Item>
      <Menu.Item key="pdf" icon={<FilePdfOutlined />} onClick={handleExportPdf}>
        Export as PDF
      </Menu.Item>
      <Menu.Item key="print" icon={<PrinterOutlined />} onClick={handlePrint}>
        Print
      </Menu.Item>
      <Menu.SubMenu key="email" icon={<MailOutlined />} title="Email as">
        <Menu.Item key="emailExcel" onClick={() => showEmailModal('excel')}>
          Excel
        </Menu.Item>
        <Menu.Item key="emailPdf" onClick={() => showEmailModal('pdf')}>
          PDF
        </Menu.Item>
      </Menu.SubMenu>
    </Menu>
  );


  const paginatedSales = Array.isArray(filteredSales) 
    ? filteredSales.slice((currentPage - 1) * pageSize, currentPage * pageSize) 
    : [];


  const columns = [
    {
      title: 'ID',
      dataIndex: '_id',
      key: '_id',
      ellipsis: true,
      width: 100,
    },
    {
      title: 'Customer',
      dataIndex: 'customerId',
      key: 'customer',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      render: (customerId: any, record: Sale) => {
        let customerName = 'Walk-in Customer';
        
        if (typeof customerId === 'object' && customerId && 'name' in customerId) {
          customerName = customerId.name;
        }
        
        return <span style={{ opacity: record.isActive ? 1 : 0.5 }}>{customerName}</span>;
      },
    },
    {
      title: 'Products',
      dataIndex: 'products',
      key: 'products',
      render: (products: SaleProduct[], record: Sale) => {
        if (!Array.isArray(products)) return null;
        
        return (
          <div style={{ opacity: record.isActive ? 1 : 0.5 }}>
            <ul style={{ paddingLeft: '20px', margin: 0 }}>
              {products.map((item, index) => {
                let productName = 'Unknown';
                const quantity = item.quantity || 0;
                
                if (typeof item.productId === 'object' && item.productId && 'productName' in item.productId) {
                  productName = item.productId.productName;
                }
                
                return (
                  <li key={index}>
                    {productName} x {quantity}
                  </li>
                );
              })}
            </ul>
          </div>
        );
      },
    },
    {
      title: 'Payment Method',
      dataIndex: 'paymentMethod',
      key: 'paymentMethod',
      render: (text: string, record: Sale) => (
        <span style={{ opacity: record.isActive ? 1 : 0.5 }}>{text}</span>
      ),
    },
    {
      title: 'Total Price',
      dataIndex: 'totalPrice',
      key: 'totalPrice',
      render: (price: number, record: Sale) => (
        <span style={{ opacity: record.isActive ? 1 : 0.5 }}>${price.toFixed(2)}</span>
      ),
    },
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      render: (date: string, record: Sale) => (
        <span style={{ opacity: record.isActive ? 1 : 0.5 }}>{dayjs(date).format('YYYY-MM-DD')}</span>
      ),
    },
    {
      title: 'Payment Status (Click to update)',
      dataIndex: 'isPaid',
      key: 'isPaid',
      render: (isPaid: boolean, record: Sale) => (
        <Tag 
          color={isPaid ? 'green' : 'volcano'}
          style={{ 
            cursor: 'pointer', 
            opacity: record.isActive ? 1 : 0.5,
            padding: '5px 12px',
            fontSize: '14px',
            borderRadius: '4px'
          }}
          onClick={() => handleUpdatePaymentStatus(record._id, !isPaid)}
          icon={isPaid ? <CheckCircleOutlined /> : <CloseCircleOutlined />}
        >
          {isPaid ? 'PAID' : 'UNPAID'}
        </Tag>
      ),
    },
    {
      title: 'Status (Click to update)',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (isActive: boolean, record: Sale) => (
        <Tag
          color={isActive ? 'blue' : 'gray'}
          style={{ 
            cursor: 'pointer', 
            padding: '5px 12px',
            fontSize: '14px',
            borderRadius: '4px'
          }}
          onClick={() => handleToggleActiveStatus(record._id, !isActive)}
        >
          {isActive ? 'ACTIVE' : 'INACTIVE'}
        </Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: unknown, record: Sale) => (
        <Button 
          type="primary"
          icon={<EditOutlined />} 
          onClick={() => showEditModal(record)}
          disabled={!record.isActive}
          style={{ 
            backgroundColor: record.isActive ? '#1890ff' : '#d9d9d9',
            opacity: record.isActive ? 1 : 0.5
          }}
        />
      ),
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <h1 className="text-2xl font-bold">Sales</h1>
        <Space>
          <Dropdown overlay={exportMenu} placement="bottomRight">
            <Button icon={<DownloadOutlined />}>
              Export
            </Button>
          </Dropdown>
          <motion.div whileHover={{ scale: 1.05 }}>
            <Button 
              type="primary" 
              icon={<PlusOutlined />} 
              onClick={showAddModal}
              style={{ backgroundColor: '#52c41a' }}
            >
              Add Sale
            </Button>
          </motion.div>
        </Space>
      </div>

      <div style={{ marginBottom: 16 }}>
        <Input
          placeholder="Search by customer, product, payment method, payment status, or active status"
          prefix={<SearchOutlined />}
          value={searchText}
          onChange={e => setSearchText(e.target.value)}
          allowClear
        />
      </div>

      <Table
        columns={columns}
        dataSource={paginatedSales}
        rowKey="_id"
        loading={loading}
        pagination={false}
        style={{ marginBottom: 16 }}
        rowClassName={(record) => !record.isActive ? 'inactive-row' : ''}
      />

      <Pagination
        current={currentPage}
        total={Array.isArray(filteredSales) ? filteredSales.length : 0}
        pageSize={pageSize}
        onChange={page => setCurrentPage(page)}
        showSizeChanger={false}
      />

      <Modal
        title={isEditMode ? 'Edit Sale' : 'Add New Sale'}
        open={isModalVisible}
        onCancel={handleCancel}
        footer={[
          <Button key="cancel" onClick={handleCancel}>
            Cancel
          </Button>,
          <Button key="submit" type="primary" onClick={handleSubmit} style={{ backgroundColor: '#52c41a' }}>
            {isEditMode ? 'Update' : 'Add'}
          </Button>,
        ]}
        width={800}
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            products: [{ productId: undefined, quantity: 1 }],
            paymentMethod: 'Cash',
            subtotal: 0,
            tax: 0,
            totalPrice: 0,
            date: dayjs(),
            isPaid: false,
            isActive: 'active',
          }}
        >
          {isEditMode && (
            <Form.Item
              name="customerName"
              label="Customer Name"
            >
              <Input disabled />
            </Form.Item>
          )}
          
          <Form.Item
            
            label={isEditMode ? "Change Customer" : "Customer"}
          >
            <Select 
              allowClear 
              placeholder="Select a customer (optional for cash sales)"
              options={Array.isArray(listedCustomers) ? listedCustomers.map(c => ({ label: c.name, value: c._id })) : []}
            />
          </Form.Item>

          <Form.Item label="Products">
            <Button type="dashed" onClick={handleAddProduct} style={{ marginBottom: 8 }}>
              + Add Product
            </Button>
            
            <Form.List name="products">
              {(fields, { remove }) => (
                <>
                  {fields.map(({ key, name, ...restField }) => (
                    <div key={key} style={{ display: 'flex', marginBottom: 8 }}>
                      {isEditMode && form.getFieldValue(['products', name, 'productName']) && (
                        <Input
                          disabled
                          value={form.getFieldValue(['products', name, 'productName'])}
                          style={{ width: '60%', marginRight: 8, marginBottom: 0 }}
                          placeholder="Product name"
                        />
                      )}
                      
                      {(!isEditMode || !form.getFieldValue(['products', name, 'productName'])) && (
                        <Form.Item
                          {...restField}
                          name={[name, `productId`]}
                          rules={[{ required: true, message: 'Please select a product' }]}
                          style={{ width: '60%', marginRight: 8, marginBottom: 0 }}
                        >
                          <Select
                            placeholder="Select product"
                            options={Array.isArray(listedProductData) ? listedProductData.map(p => ({ 
                              label: `${p.productName} - $${p.price} (${p.quantity} in stock)`, 
                              value: p._id 
                            })) : []}
                            onChange={() => updatePrices()}
                          />
                        </Form.Item>
                      )}
                      
                      <Form.Item
                        {...restField}
                        name={[name, 'quantity']}
                        rules={[{ required: true, message: 'Quantity required' }]}
                        style={{ width: '30%', marginRight: 8, marginBottom: 0 }}
                      >
                        <InputNumber
                          min={1}
                          placeholder="Qty"
                          onChange={() => updatePrices()}
                          style={{ width: '100%' }}
                        />
                      </Form.Item>
                      
                      <Button 
                        danger
                        onClick={() => {
                          remove(name);
                          setTimeout(updatePrices, 0);
                        }}
                      >
                        X
                      </Button>
                    </div>
                  ))}
                </>
              )}
            </Form.List>
          </Form.Item>

          <Form.Item
            name="paymentMethod"
            label="Payment Method"
            rules={[{ required: true, message: 'Please select payment method' }]}
          >
            <Select>
              <Select.Option value="Cash">Cash</Select.Option>
              <Select.Option value="Online">Online</Select.Option>
              <Select.Option value="Credit Card">Credit Card</Select.Option>
              <Select.Option value="Debit Card">Debit Card</Select.Option>
              <Select.Option value="UPI">UPI</Select.Option>
              <Select.Option value="Bank Transfer">Bank Transfer</Select.Option>
            </Select>
          </Form.Item>

          <div style={{ display: 'flex', gap: '16px' }}>
            <Form.Item
              name="totalPrice"
              label="Total Price"
              style={{ width: '100%' }}
              rules={[{ required: true, message: 'Total price required' }]}
            >
              <InputNumber
                style={{ width: '100%' }}
                formatter={value => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                parser={value => value!.replace(/\$\s?|(,*)/g, '')}
              />
            </Form.Item>
          </div>

          <Form.Item
            name="date"
            label="Sale Date"
            rules={[{ required: true, message: 'Date is required' }]}
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            name="isPaid"
            label="Payment Status"
            rules={[{ required: true, message: 'Please select payment status' }]}
          >
            <Select>
              <Select.Option value={true}>
                <Tag color="green" style={{ padding: '2px 8px' }}>Paid</Tag>
              </Select.Option>
              <Select.Option value={false}>
                <Tag color="volcano" style={{ padding: '2px 8px' }}>Unpaid</Tag>
              </Select.Option>
            </Select>
          </Form.Item>

          <Form.Item name="subtotal" hidden={true}>
            <InputNumber />
          </Form.Item>
          <Form.Item name="tax" hidden={true}>
            <InputNumber />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Send Sales Report by Email"
        open={isEmailModalVisible}
        onCancel={() => setIsEmailModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setIsEmailModalVisible(false)}>
            Cancel
          </Button>,
          <Button key="submit" type="primary" onClick={handleEmailSubmit} style={{ backgroundColor: '#1890ff' }}>
            Send
          </Button>,
        ]}
      >
        <Form
          form={emailForm}
          layout="vertical"
        >
          <Form.Item
            name="email"
            label="Recipient Email"
            rules={[
              { required: true, message: 'Please enter recipient email' },
              { type: 'email', message: 'Please enter a valid email' }
            ]}
          >
            <Input placeholder="example@example.com" />
          </Form.Item>

          <Form.Item
            name="subject"
            label="Subject"
            rules={[{ required: true, message: 'Please enter email subject' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="message"
            label="Message"
            rules={[{ required: true, message: 'Please enter email message' }]}
          >
            <Input.TextArea rows={4} />
          </Form.Item>

          <p>Report will be sent as {exportFormat.toUpperCase()} attachment.</p>
        </Form>
      </Modal>

    </motion.div>
  );
}