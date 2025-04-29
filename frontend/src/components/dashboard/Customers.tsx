import React, { useState, useEffect } from 'react';
import {
  Table, Button, Input, Modal, Form, Space, Popconfirm, message, Pagination,
  Typography, Row, Col, Card, Spin, Divider, Select, Dropdown, Tag
} from 'antd';
import {
  PlusOutlined, EditOutlined, SearchOutlined,
  ReloadOutlined, UserOutlined, MailOutlined, PhoneOutlined, HomeOutlined,
  DownloadOutlined, FileExcelOutlined, FilePdfOutlined, PrinterOutlined, SendOutlined,
  LockOutlined, UnlockOutlined
} from '@ant-design/icons';
import { motion, AnimatePresence } from 'framer-motion';
import { userInstance } from '../../middlewares/axios';
import { exportToExcel, exportToPdf, printData } from '../../utils/CustomerFunctions';
import { EmailExportModal } from '../dashboard/Email';
import { addCustomerApi, fetchCustomers, updateCustomerApi, toggleCustomerStatusApi } from '../../api/customerApi';
import { AxiosError } from 'axios';
import { Customer,CustomerFormValues,EmailFormValues } from '../../interfaces/ICustomer';

const { Title } = Typography;
const { Option } = Select;


export function Customers(): React.ReactElement {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [allCustomers, setAllCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [modalTitle, setModalTitle] = useState<string>('Add Customer');
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [searchText, setSearchText] = useState<string>('');
  const [emailModalVisible, setEmailModalVisible] = useState<boolean>(false);
  const [emailSending, setEmailSending] = useState<boolean>(false);
  const [form] = Form.useForm();
  const [emailForm] = Form.useForm();

  const getCustomers = async (): Promise<void> => {
    setLoading(true);
    try {
      const customers = await fetchCustomers();
      setAllCustomers(customers);
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        message.error(error.response?.data?.message || "Failed to fetch customers");
      } else if (error instanceof Error) {
        message.error(error.message);
      } else {
        message.error("An unknown error occurred");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getCustomers();
  }, []);

  useEffect(() => {
    let filteredData = [...allCustomers];

    if (searchText) {
      const lowerCaseSearch = searchText.toLowerCase();
      filteredData = filteredData.filter(customer =>
        customer.name.toLowerCase().includes(lowerCaseSearch) ||
        customer.email.toLowerCase().includes(lowerCaseSearch) ||
        customer.mobileNumber.toLowerCase().includes(lowerCaseSearch) ||
        customer.address.city.toLowerCase().includes(lowerCaseSearch) ||
        customer.address.country.toLowerCase().includes(lowerCaseSearch)
      );
    }

    const startIndex = (currentPage - 1) * pageSize;
    const paginatedData = filteredData.slice(startIndex, startIndex + pageSize);

    setCustomers(paginatedData);
  }, [allCustomers, searchText, currentPage, pageSize]);

  const addCustomer = async (values: CustomerFormValues) => {
    setLoading(true);
    try {
      const newCustomer = await addCustomerApi(values);
      message.success("Customer added successfully");
  
      setAllCustomers([...allCustomers, newCustomer]);
      form.resetFields();
      setModalVisible(false);
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        message.error(error.response?.data?.message || "Failed to add customer");
      } else if (error instanceof Error) {
        message.error(error.message);
      } else {
        message.error("An unexpected error occurred");
      }
    } finally {
      setLoading(false);
    }
  };

const updateCustomer = async (values: CustomerFormValues) => {
    if (!editingCustomer) return;
  
    setLoading(true);
    try {
      const updatedCustomer = await updateCustomerApi(editingCustomer._id, values);
      message.success("Customer updated successfully");
  
      setAllCustomers(allCustomers.map(customer =>
        customer._id === editingCustomer._id ? updatedCustomer : customer
      ));
  
      form.resetFields();
      setModalVisible(false);
      setEditingCustomer(null);
    } catch (error: unknown) {
      if (error instanceof Error) {
        message.error(error.message);
      } else {
        message.error("An unexpected error occurred");
      }
    } finally {
      setLoading(false);
    }
  };

  const toggleCustomerStatus = async (id: string, currentStatus: boolean | undefined) => {
    setLoading(true);
    try {
      await toggleCustomerStatusApi(id);
      
      const newStatus = !currentStatus;
      message.success(`Customer ${newStatus ? 'blocked' : 'unblocked'} successfully`);
  
      const updatedCustomers = allCustomers.map(customer => 
        customer._id === id ? { ...customer, isBlocked: newStatus } : customer
      );
      setAllCustomers(updatedCustomers);
    } catch (error: unknown) {
      if (error instanceof Error) {
        message.error(error.message);
      } else {
        message.error("An unexpected error occurred");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (values: CustomerFormValues) => {
    if (editingCustomer) {
      updateCustomer(values);
    } else {
      addCustomer(values);
    }
  };

  const showModal = (customer?: Customer) => {
    if (customer) {
      setModalTitle('Edit Customer');
      setEditingCustomer(customer);
      form.setFieldsValue({
        name: customer.name,
        email: customer.email,
        mobileNumber: customer.mobileNumber,
        street: customer.address.street,
        city: customer.address.city,
        state: customer.address.state,
        zipCode: customer.address.zipCode,
        country: customer.address.country
      });
    } else {
      setModalTitle('Add Customer');
      setEditingCustomer(null);
      form.resetFields();
    }
    setModalVisible(true);
  };

  const handleSearch = (value: string) => {
    setSearchText(value);
    setCurrentPage(1);
  };


  const resetSearch = () => {
    setSearchText('');
    setCurrentPage(1);
  };

  const getFilteredTotal = () => {
    if (!searchText) return allCustomers.length;

    const lowerCaseSearch = searchText.toLowerCase();
    return allCustomers.filter(customer =>
      customer.name.toLowerCase().includes(lowerCaseSearch) ||
      customer.email.toLowerCase().includes(lowerCaseSearch) ||
      customer.mobileNumber.toLowerCase().includes(lowerCaseSearch) ||
      customer.address.city.toLowerCase().includes(lowerCaseSearch) ||
      customer.address.country.toLowerCase().includes(lowerCaseSearch)
    ).length;
  };

  const handleExportToExcel = () => {
    const dataToExport = searchText ? customers : allCustomers;

    const formattedData = dataToExport.map(customer => ({
      'Name': customer.name,
      'Email': customer.email,
      'Mobile Number': customer.mobileNumber,
      'Street': customer.address.street,
      'City': customer.address.city,
      'State': customer.address.state,
      'Zip Code': customer.address.zipCode,
      'Country': customer.address.country,
      'Status': customer.isBlocked ? 'Blocked' : 'Active'
    }));

    exportToExcel(formattedData, 'Customers_Report');
    message.success('Customer data exported to Excel successfully');
  };

  const handleExportToPdf = () => {
    const dataToExport = searchText ? customers : allCustomers;

    const formattedData = dataToExport.map(customer => ({
      'Name': customer.name,
      'Email': customer.email,
      'Mobile': customer.mobileNumber,
      'Address': `${customer.address.city}, ${customer.address.country}`,
      'Status': customer.isBlocked ? 'Blocked' : 'Active'
    }));

    exportToPdf(formattedData, 'Customers_Report', 'Customer List');
    message.success('Customer data exported to PDF successfully');
  };

  const handlePrint = () => {
    const dataToExport = searchText ? customers : allCustomers;

    const formattedData = dataToExport.map(customer => ({
      'Name': customer.name,
      'Email': customer.email,
      'Mobile': customer.mobileNumber,
      'Address': `${customer.address.city}, ${customer.address.country}`,
      'Status': customer.isBlocked ? 'Blocked' : 'Active'
    }));

    printData(formattedData, 'Customer List');
    message.success('Print initiated successfully');
  };

  const handleEmailModalOpen = () => {
    setEmailModalVisible(true);
    emailForm.resetFields();
  };

  const handleSendEmail = async (values: EmailFormValues) => {
    setEmailSending(true);
    try {
      const dataToSend = searchText ? customers : allCustomers;

      const formattedData = dataToSend.map(customer => ({
        name: customer.name,
        email: customer.email,
        mobileNumber: customer.mobileNumber,
        address: `${customer.address.city}, ${customer.address.country}`,
        status: customer.isBlocked ? 'Blocked' : 'Active'
      }));

      await userInstance.post('api/customer/send-customer-details', {
        email: values.recipient,
        subject: values.subject,
        message: values.message,
        customers: formattedData
      });

      message.success('Customer report sent via email successfully');
      setEmailModalVisible(false);
      emailForm.resetFields();
    } catch (error) {
      message.error('Failed to send email');
      console.error('Error sending email:', error);
    } finally {
      setEmailSending(false);
    }
  };

  const exportMenuItems = [
    {
      key: 'excel',
      icon: <FileExcelOutlined />,
      label: 'Export to Excel',
      onClick: handleExportToExcel
    },
    {
      key: 'pdf',
      icon: <FilePdfOutlined />,
      label: 'Export to PDF',
      onClick: handleExportToPdf
    },
    {
      key: 'print',
      icon: <PrinterOutlined />,
      label: 'Print',
      onClick: handlePrint
    },
    {
      key: 'email',
      icon: <SendOutlined />,
      label: 'Send via Email',
      onClick: handleEmailModalOpen
    }
  ];

  const customerColumns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (text: string) => (
        <span>
          <UserOutlined className="mr-2 text-blue-500" />
          {text}
        </span>
      )
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      render: (text: string) => (
        <span>
          <MailOutlined className="mr-2 text-green-500" />
          {text}
        </span>
      )
    },
    {
      title: 'Mobile',
      dataIndex: 'mobileNumber',
      key: 'mobileNumber',
      render: (text: string) => (
        <span>
          <PhoneOutlined className="mr-2 text-purple-500" />
          {text}
        </span>
      )
    },
    {
      title: 'Location',
      key: 'location',
      render: (_: string, record: Customer) => (
        <span>
          <HomeOutlined className="mr-2 text-orange-500" />
          {record.address.city}, {record.address.country}
        </span>
      )
    },
    {
      title: 'Status',
      key: 'status',
      render: (_: string, record: Customer) => (
        <Tag color={record.isBlocked ? 'red' : 'green'}>
          {record.isBlocked ? 'Blocked' : 'Active'}
        </Tag>
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: string, record: Customer) => (
        <Space size="middle">
          <Button
            type="primary"
            icon={<EditOutlined />}
            size="small"
            onClick={() => showModal(record)}
          >
            Edit
          </Button>
          {record.isBlocked ? (
            <Popconfirm
              title="Unblock customer"
              description="Are you sure you want to unblock this customer?"
              onConfirm={() => toggleCustomerStatus(record._id, record.isBlocked)}
              okText="Yes"
              cancelText="No"
            >
              <Button
                type="primary"
                icon={<UnlockOutlined />}
                size="small"
                style={{ backgroundColor: '#52c41a' }}
              >
                Unblock
              </Button>
            </Popconfirm>
          ) : (
            <Popconfirm
              title="Block customer"
              description="Are you sure you want to block this customer?"
              onConfirm={() => toggleCustomerStatus(record._id, record.isBlocked)}
              okText="Yes"
              cancelText="No"
            >
              <Button
                danger
                icon={<LockOutlined />}
                size="small"
              >
                Block
              </Button>
            </Popconfirm>
          )}
        </Space>
      )
    }
  ];

  const filteredTotal = getFilteredTotal();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="p-6"
    >
      <Card className="w-full shadow-md">
        <div className="flex justify-between items-center mb-6">
          <Title level={2} className="m-0">Customers</Title>
          <Space>
            <Dropdown menu={{ items: exportMenuItems }}>
              <Button icon={<DownloadOutlined />} size="large">
                Export <span className="ml-1">▼</span>
              </Button>
            </Dropdown>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => showModal()}
              size="large"
            >
              Add Customer
            </Button>
          </Space>
        </div>

        <Divider />

        <div className="mb-6">
          <Row gutter={16} className="flex items-center">
            <Col xs={24} sm={16} md={12} lg={8}>
              <Input
                placeholder="Search customers..."
                prefix={<SearchOutlined />}
                value={searchText}
                onChange={(e) => handleSearch(e.target.value)}
                allowClear
                size="large"
              />
            </Col>
            <Col>
              <Button
                icon={<ReloadOutlined />}
                onClick={resetSearch}
                size="large"
              >
                Reset
              </Button>
            </Col>
          </Row>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={loading ? 'loading' : 'content'}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            {loading && allCustomers.length === 0 ? (
              <div className="flex justify-center items-center h-64">
                <Spin size="large" />
              </div>
            ) : (
              <>
                <Table
                  dataSource={customers}
                  columns={customerColumns}
                  rowKey="_id"
                  pagination={false}
                  className="mb-4"
                  locale={{ emptyText: "No customers found" }}
                />

                <div className="flex justify-end mt-4">
                  <Pagination
                    current={currentPage}
                    pageSize={pageSize}
                    total={filteredTotal}
                    onChange={(page) => setCurrentPage(page)}
                    onShowSizeChange={(_, size) => {
                      setCurrentPage(1);
                      setPageSize(size);
                    }}
                    showSizeChanger
                    showQuickJumper
                    showTotal={(total) => `Total ${total} customers`}
                  />
                </div>

              </>
            )}
          </motion.div>
        </AnimatePresence>
      </Card>

      <Modal
        title={
          <div className="text-xl">
            {modalTitle}
          </div>
        }
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={700}
        destroyOnClose
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            initialValues={{
              name: '',
              email: '',
              mobileNumber: '',
              street: '',
              city: '',
              state: '',
              zipCode: '',
              country: ''
            }}
          >
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="name"
                  label="Name"
                  rules={[{ required: true, message: 'Please enter customer name' }]}
                >
                  <Input prefix={<UserOutlined />} placeholder="Enter name" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="email"
                  label="Email"
                  rules={[
                    { required: true, message: 'Please enter email' },
                    { type: 'email', message: 'Please enter a valid email' }
                  ]}
                >
                  <Input prefix={<MailOutlined />} placeholder="Enter email" />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item
              name="mobileNumber"
              label="Mobile Number"
              rules={[{ required: true, message: 'Please enter mobile number' }]}
            >
              <Input prefix={<PhoneOutlined />} placeholder="Enter mobile number" />
            </Form.Item>

            <Divider orientation="left">Address Information</Divider>

            <Form.Item
              name="street"
              label="Street Address"
              rules={[{ required: true, message: 'Please enter street address' }]}
            >
              <Input prefix={<HomeOutlined />} placeholder="Enter street address" />
            </Form.Item>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="city"
                  label="City"
                  rules={[{ required: true, message: 'Please enter city' }]}
                >
                  <Input placeholder="Enter city" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="state"
                  label="State/Province"
                  rules={[{ required: true, message: 'Please enter state/province' }]}
                >
                  <Input placeholder="Enter state/province" />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="zipCode"
                  label="Zip/Postal Code"
                  rules={[{ required: true, message: 'Please enter zip/postal code' }]}
                >
                  <Input placeholder="Enter zip/postal code" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="country"
                  label="Country"
                  rules={[{ required: true, message: 'Please select country' }]}
                >
                  <Select placeholder="Select country">
                    <Option value="United States">United States</Option>
                    <Option value="Canada">Canada</Option>
                    <Option value="United Kingdom">United Kingdom</Option>
                    <Option value="Australia">Australia</Option>
                    <Option value="Germany">Germany</Option>
                    <Option value="France">France</Option>
                    <Option value="India">India</Option>
                    <Option value="Japan">Japan</Option>
                    <Option value="China">China</Option>
                    <Option value="Brazil">Brazil</Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            <div className="flex justify-end mt-4">
              <Button onClick={() => setModalVisible(false)} className="mr-2">
                Cancel
              </Button>
              <Button type="primary" htmlType="submit" loading={loading}>
                {editingCustomer ? 'Update Customer' : 'Add Customer'}
              </Button>
            </div>
          </Form>
        </motion.div>
      </Modal>

      <EmailExportModal
        visible={emailModalVisible}
        onCancel={() => setEmailModalVisible(false)}
        form={emailForm}
        onFinish={handleSendEmail}
        loading={emailSending}
      />
    </motion.div>
  );
}