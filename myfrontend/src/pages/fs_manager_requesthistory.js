import React, { useState, useEffect } from 'react';
import { Table, Input, Spin, Typography, Layout, Pagination} from 'antd';
import requestService from '../services/requestService';
import './fs_manager_requesthistory.css'; // Файл для стилей страницы

const { Content } = Layout;
const { Title } = Typography;

const FsManagerRequestHistory = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(100);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState('');
  const [sortOrder, setSortOrder] = useState('');

  useEffect(() => {
    fetchData();
  }, [page, pageSize, search, sortField, sortOrder]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await requestService.getRequestHistory({
        page,
        pageSize,
        search,
        sortField,
        sortOrder,
      });
      console.log('API Response:', response); // Логируем ответ API
      setData(response.results || []);
      setTotal(response.count || 0);
    } catch (error) {
      console.error('Ошибка при загрузке истории операций:', error);
    } finally {
      setLoading(false);
    }
  };  

  const columns = [
    {
      title: 'Заявка',
      dataIndex: 'st_request', // Здесь должен быть ключ для сортировки
      key: 'st_request__RequestNumber', // Это поле передается в ordering
      sorter: true,
      render: (text) => text || 'N/A',
    },
    {
      title: 'Штрихкод',
      dataIndex: 'product', // Здесь должен быть ключ для сортировки
      key: 'product__barcode', // Это поле передается в ordering
      sorter: true,
      render: (text) => text || 'N/A',
    },
    {
        title: 'Пользователь',
        dataIndex: 'user',
        key: 'user',
        sorter: true,
        render: (user) => {
          if (user && user.first_name && user.last_name) {
            return `${user.first_name} ${user.last_name}`;
          }
          return 'N/A';
        },
      },          
    {
      title: 'Время',
      dataIndex: 'date',
      key: 'date', // Это поле передается в ordering
      sorter: true,
      render: (date) => new Date(date).toLocaleString(),
    },
    {
      title: 'Операция',
      dataIndex: 'operation', // Здесь должен быть ключ для сортировки
      key: 'operation__name', // Это поле передается в ordering
      sorter: true,
      render: (text) => text || 'N/A',
    },
  ];

  const handleTableChange = (pagination, filters, sorter) => {
    setPage(pagination.current || 1);
    setPageSize(pagination.pageSize || 100);
  
    if (sorter && sorter.columnKey) {
      setSortField(sorter.columnKey);
      setSortOrder(sorter.order === 'ascend' ? 'asc' : 'desc');
    } else {
      setSortField('');
      setSortOrder('');
    }
  };  

  return (
    <Content className="request-history-content">
      <Title level={2} className="request-history-title">История операций с заявками</Title>
      <Input.Search
        placeholder="Поиск..."
        allowClear
        onSearch={(value) => setSearch(value)}
        style={{ marginBottom: 16 }}
      />
        <Spin spinning={loading}>
        <Table
            columns={columns}
            dataSource={data}
            rowKey={(record) => record.id}
            pagination={false} // Убираем встроенный пагинатор
            onChange={handleTableChange}
            bordered
        />
        {/* Пагинатор вынесен ниже */}
        <div style={{ marginTop: '16px', textAlign: 'center' }}>
        <Pagination
            current={page}
            pageSize={pageSize}
            total={total}
            showSizeChanger
            onShowSizeChange={(current, size) => {
                setPageSize(size);
                setPage(1); // Сброс на первую страницу при изменении размера
            }}
            onChange={(current) => setPage(current)}
            pageSizeOptions={['10', '25', '50', '100']} // Корректный массив опций
            />
        </div>
        </Spin>
    </Content>
  );
};

export default FsManagerRequestHistory;
