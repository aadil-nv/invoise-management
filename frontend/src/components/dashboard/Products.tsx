import { useState, useEffect } from 'react';
import { Table, Button, Input, Modal, Form, InputNumber, Pagination, message, Dropdown, Menu, Popconfirm, Switch } from 'antd';
import { 
  SearchOutlined, 
  PlusOutlined, 
  EditOutlined, 
  DownloadOutlined,
  PrinterOutlined,
  MailOutlined,
  FileExcelOutlined,
  FilePdfOutlined,
  EyeOutlined,
  EyeInvisibleOutlined
} from '@ant-design/icons';
import { motion, AnimatePresence } from 'framer-motion';
import { productApi } from '../../api/productApi';
import { exportToExcel, exportToPdf, printData, sendEmail } from '../../utils/ProductFunctions';
import toast from 'react-hot-toast';
import { AxiosError } from 'axios';
import { EmailFormValues, Product } from '../../interfaces/IProduct';



export function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [displayedProducts, setDisplayedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [actionLoading, setActionLoading] = useState<{ [key: string]: boolean }>({});
  const [isModalVisible, setIsModalVisible] = useState<boolean>(false);
  const [isEmailModalVisible, setIsEmailModalVisible] = useState<boolean>(false);
  const [currentProduct, setCurrentProduct] = useState<Product | null>(null);
  const [searchText, setSearchText] = useState<string>('');
  const [searchBy, setSearchBy] = useState<'name' | 'description' | 'both'>('both');
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 5,
    total: 0
  });

  const [form] = Form.useForm();
  const [emailForm] = Form.useForm();

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    handleClientSidePagination();
  }, [products, searchText, searchBy, pagination.current, pagination.pageSize]);

  const fetchProducts = async (): Promise<void> => {
    try {
      setLoading(true);
      const response = await productApi.listProducts();
      
      setProducts(response.products || []);
      setPagination({
        ...pagination,
        total: response.products?.length || 0
      });
    } catch (error) {
      message.error('Failed to fetch products');
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClientSidePagination = (): void => {
    const filteredProducts = products.filter(product => {
      const nameMatch = product.productName.toLowerCase().includes(searchText.toLowerCase());
      const descriptionMatch = product.description.toLowerCase().includes(searchText.toLowerCase());
      
      if (searchBy === 'name') return nameMatch;
      if (searchBy === 'description') return descriptionMatch;
      return nameMatch || descriptionMatch; // 'both' option
    });
    
    // Calculate pagination
    const startIndex = (pagination.current - 1) * pagination.pageSize;
    const endIndex = startIndex + pagination.pageSize;
    
    // Update displayed products and total
    setDisplayedProducts(filteredProducts.slice(startIndex, endIndex));
    setPagination(prev => ({
      ...prev,
      total: filteredProducts.length
    }));
  };

  const handleSubmit = async (): Promise<void> => {
    try {
      const values = await form.validateFields();
      setLoading(true);
  
      if (currentProduct) {
        await productApi.updateProduct(currentProduct._id, values);
        message.success('Product updated successfully');
      } else {
        await productApi.addProduct(values);
        message.success('Product added successfully');
      }
  
      setIsModalVisible(false);
      form.resetFields();
      fetchProducts();
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        toast.error(
          error.response?.data?.message ||
          error.response?.data?.errors?.[0]?.msg ||
          (currentProduct ? 'Failed to update product' : 'Failed to add product')
        );
      }
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };
  

  const handleToggleListStatus = async (id: string, currentStatus: boolean): Promise<void> => {
    try {
      setActionLoading(prev => ({ ...prev, [id]: true }));
      
      await productApi.toggleProductListing(id);
      
      setProducts(prevProducts => 
        prevProducts.map(product => 
          product._id === id 
            ? { ...product, isListed: !currentStatus } 
            : product
        )
      );
      
      message.success(`Product ${currentStatus ? 'unlisted' : 'listed'} successfully`);
    } catch (error) {
      message.error(`Failed to ${currentStatus ? 'unlist' : 'list'} product`);
      console.error('Error:', error);
    } finally {
      // Clear loading state for this specific product
      setActionLoading(prev => ({ ...prev, [id]: false }));
    }
  };

  const showAddModal = (): void => {
    setCurrentProduct(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const showEditModal = (product: Product): void => {
    setCurrentProduct(product);
    form.setFieldsValue(product);
    setIsModalVisible(true);
  };

  const handleSearch = (value: string): void => {
    setSearchText(value);
    setPagination(prev => ({
      ...prev,
      current: 1 
    }));
  };

  const handleSearchByChange = (value: 'name' | 'description' | 'both'): void => {
    setSearchBy(value);
    setPagination(prev => ({
      ...prev,
      current: 1 
    }));
  };


  const handlePaginationChange = (page: number, pageSize?: number): void => {
    setPagination({
      ...pagination,
      current: page,
      pageSize: pageSize || pagination.pageSize
    });
  };


  const handleExportToExcel = (): void => {
    exportToExcel(products, 'ProductsData');
    message.success('Products exported to Excel successfully');
  };


  const handleExportToPdf = (): void => {
    exportToPdf(products, 'ProductsData');
    message.success('Products exported to PDF successfully');
  };


  const handlePrint = (): void => {
    printData(products);
    message.success('Print job sent successfully');
  };

  const showEmailModal = (): void => {
    emailForm.resetFields();
    setIsEmailModalVisible(true);
  };

  
  const handleSendEmail = async (): Promise<void> => {
    try {
      const values: EmailFormValues = await emailForm.validateFields();
      setLoading(true);
      
   
      await sendEmail(
        values.email,
        values.subject,
        values.message,
        products
      );
      
      setIsEmailModalVisible(false);
      emailForm.resetFields();
      message.success('Email sent successfully');
    } catch (error) {
      message.error('Failed to send email');
      console.error('Error sending email:', error);
    } finally {
      setLoading(false);
    }
  };


  const searchMenu = (
    <Menu>
      <Menu.Item 
        key="name" 
        onClick={() => handleSearchByChange('name')}
        className={searchBy === 'name' ? 'ant-menu-item-selected' : ''}
      >
        Search by Name
      </Menu.Item>
      <Menu.Item 
        key="description" 
        onClick={() => handleSearchByChange('description')}
        className={searchBy === 'description' ? 'ant-menu-item-selected' : ''}
      >
        Search by Description
      </Menu.Item>
      <Menu.Item 
        key="both" 
        onClick={() => handleSearchByChange('both')}
        className={searchBy === 'both' ? 'ant-menu-item-selected' : ''}
      >
        Search by Both
      </Menu.Item>
    </Menu>
  );


  const columns = [
    {
      title: 'Product Name',
      dataIndex: 'productName',
      key: 'productName',
      sorter: (a: Product, b: Product) => a.productName.localeCompare(b.productName)
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true
    },
    {
      title: 'Quantity',
      dataIndex: 'quantity',
      key: 'quantity',
      sorter: (a: Product, b: Product) => a.quantity - b.quantity
    },
    {
      title: 'Price',
      dataIndex: 'price',
      key: 'price',
      render: (price: number) => `$${price.toFixed(2)}`,
      sorter: (a: Product, b: Product) => a.price - b.price
    },
    {
      title: 'Status',
      dataIndex: 'isListed',
      key: 'isListed',
      render: (isListed: boolean) => (
        <span className={`px-2 py-1 rounded-full text-xs ${isListed ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {isListed ? 'Listed' : 'Unlisted'}
        </span>
      ),
      sorter: (a: Product, b: Product) => (a.isListed === b.isListed ? 0 : a.isListed ? 1 : -1)
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: unknown, record: Product) => (
        <div className="flex space-x-2">
          <Button
            type="primary"
            icon={<EditOutlined />}
            onClick={() => showEditModal(record)}
            size="small"
          >
            Edit
          </Button>
          
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Popconfirm
              title={`Are you sure you want to ${record.isListed ? 'unlist' : 'list'} this product?`}
              onConfirm={() => handleToggleListStatus(record._id, record.isListed)}
              okText="Yes"
              cancelText="No"
              okButtonProps={{ 
                style: { backgroundColor: record.isListed ? '#f5222d' : '#52c41a' }
              }}
            >
              <Button
                type={record.isListed ? 'default' : 'primary'}
                danger={record.isListed}
                icon={record.isListed ? <EyeInvisibleOutlined /> : <EyeOutlined />}
                size="small"
                loading={actionLoading[record._id]}
                style={{ 
                  backgroundColor: record.isListed ? 'white' : '#52c41a',
                  borderColor: record.isListed ? '#f5222d' : '#52c41a',
                  color: record.isListed ? '#f5222d' : 'white'
                }}
              >
                {record.isListed ? 'Unlist' : 'List'}
              </Button>
            </Popconfirm>
          </motion.div>
        </div>
      )
    }
  ];


  const exportMenu = (
    <Menu>
      <Menu.Item key="excel" icon={<FileExcelOutlined />} onClick={handleExportToExcel}>
        Export to Excel
      </Menu.Item>
      <Menu.Item key="pdf" icon={<FilePdfOutlined />} onClick={handleExportToPdf}>
        Export to PDF
      </Menu.Item>
      <Menu.Item key="print" icon={<PrinterOutlined />} onClick={handlePrint}>
        Print
      </Menu.Item>
      <Menu.Item key="email" icon={<MailOutlined />} onClick={showEmailModal}>
        Send via Email
      </Menu.Item>
    </Menu>
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="p-6"
    >
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Products</h1>
        <div className="flex space-x-3">
          <Dropdown overlay={exportMenu} placement="bottomRight">
            <Button icon={<DownloadOutlined />} size="large">
              Export
            </Button>
          </Dropdown>
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={showAddModal}
              size="large"
            >
              Add Product
            </Button>
          </motion.div>
        </div>
      </div>

      <div className="mb-4 flex space-x-2">
        <Input
          placeholder={`Search by ${searchBy === 'name' ? 'product name' : searchBy === 'description' ? 'description' : 'name or description'}`}
          prefix={<SearchOutlined />}
          value={searchText}
          onChange={(e) => handleSearch(e.target.value)}
          allowClear
          className="w-64"
        />
        <Dropdown overlay={searchMenu} placement="bottomLeft">
          <Button>
            {searchBy === 'name' ? 'Search by Name' : 
             searchBy === 'description' ? 'Search by Description' : 
             'Search by Both'} ▼
          </Button>
        </Dropdown>
      </div>

      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Table
            dataSource={displayedProducts}
            columns={columns}
            rowKey="_id"
            loading={loading}
            pagination={false}
            className="mb-4"
            rowClassName={(record) => !record.isListed ? 'bg-gray-50' : ''}
          />

          <Pagination
            current={pagination.current}
            pageSize={pagination.pageSize}
            total={pagination.total}
            onChange={handlePaginationChange}
            showSizeChanger={false}
            showQuickJumper
            showTotal={(total) => `Total ${total} products`}
          />
        </motion.div>
      </AnimatePresence>

      {/* Product Form Modal */}
      <Modal
        title={currentProduct ? 'Edit Product' : 'Add New Product'}
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        onOk={handleSubmit}
        confirmLoading={loading}
      >
        <Form
          form={form}
          layout="vertical"
        >
          <Form.Item
            name="productName"
            label="Product Name"
            rules={[{ required: true, message: 'Please enter product name' }]}
          >
            <Input placeholder="Enter product name" />
          </Form.Item>

          <Form.Item
            name="description"
            label="Description"
            rules={[{ required: true, message: 'Please enter description' }]}
          >
            <Input.TextArea
              placeholder="Enter product description"
              rows={4}
            />
          </Form.Item>

          <Form.Item
            name="quantity"
            label="Quantity"
            rules={[{ required: true, message: 'Please enter quantity' }]}
          >
            <InputNumber<number>
              min={0}
              placeholder="Enter quantity"
              className="w-full"
            />
          </Form.Item>

          <Form.Item
            name="price"
            label="Price"
            rules={[{ required: true, message: 'Please enter price' }]}
          >
            <InputNumber<number>
              min={0}
              step={0.01}
              precision={2}
              formatter={(value) => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={(value) => {
                return value ? Number(value.replace(/\$\s?|(,*)/g, '')) : 0;
              }}
              placeholder="Enter price"
              className="w-full"
            />
          </Form.Item>

          {currentProduct && (
            <Form.Item
              name="isListed"
              label="Listing Status"
              valuePropName="checked"
            >
              <Switch
                checkedChildren="Listed"
                unCheckedChildren="Unlisted"
                defaultChecked={currentProduct.isListed}
              />
            </Form.Item>
          )}
        </Form>
      </Modal>

      {/* Email Modal */}
      <Modal
        title="Send Products Data via Email"
        open={isEmailModalVisible}
        onCancel={() => setIsEmailModalVisible(false)}
        onOk={handleSendEmail}
        confirmLoading={loading}
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
            <Input placeholder="Enter recipient email" />
          </Form.Item>

          <Form.Item
            name="subject"
            label="Subject"
            initialValue="Products Data"
            rules={[{ required: true, message: 'Please enter email subject' }]}
          >
            <Input placeholder="Enter email subject" />
          </Form.Item>

          <Form.Item
            name="message"
            label="Message"
            initialValue="Please find attached the products data."
            rules={[{ required: true, message: 'Please enter email message' }]}
          >
            <Input.TextArea
              placeholder="Enter email message"
              rows={4}
            />
          </Form.Item>
        </Form>
      </Modal>
    </motion.div>
  );
}