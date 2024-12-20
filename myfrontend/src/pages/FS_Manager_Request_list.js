import React, { useEffect, useState } from 'react';
import { Table, Input, Button, Space } from 'antd';
import { useNavigate } from 'react-router-dom';
import requestService from '../services/requestService';
import { SearchOutlined } from '@ant-design/icons';

const FS_Manager_Request_list = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [sortField, setSortField] = useState('');
  const [sortOrder, setSortOrder] = useState('asc');
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 50,
    total: 0,
  });

  const navigate = useNavigate();

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const data = await requestService.getSPhotographerRequests({
        search: searchValue,
        sortField,
        sortOrder,
        page: pagination.current,
        pageSize: pagination.pageSize,
      });

      setRequests(data.results);
      setPagination((prev) => ({
        ...prev,
        total: data.count,
      }));
    } catch (error) {
      console.error('Failed to fetch requests', error);
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortField, sortOrder, pagination.current]);

  const handleSearch = () => {
    setPagination((prev) => ({ ...prev, current: 1 }));
    fetchRequests();
  };

  const handleEnterPress = (e) => {
    if (e.key === 'Enter') {
      setPagination((prev) => ({ ...prev, current: 1 }));
      fetchRequests();
    }
  };

  const handleTableChange = (pag, filters, sorter) => {
    if (sorter.field) {
      setSortField(sorter.field);
      setSortOrder(sorter.order === 'ascend' ? 'asc' : 'desc');
    }

    if (pag.current !== pagination.current) {
      setPagination((prev) => ({ ...prev, current: pag.current }));
    }
  };

  const formatDate = (value) => {
    if (!value) return '';
    const date = new Date(value);
    return date.toLocaleString('ru-RU', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute:'2-digit',
      second:'2-digit'
    });
  };

  const columns = [
    {
      title: 'Номер заявки',
      dataIndex: 'RequestNumber',
      key: 'RequestNumber',
      sorter: true,
      render: (text, record) => (
        <a onClick={() => navigate(`/fs_manager_request_detail/${record.RequestNumber}`)}>
          {text}
        </a>
      )
    },
    {
      title: 'Дата создания',
      dataIndex: 'creation_date',
      key: 'creation_date',
      sorter: true,
      render: (value) => formatDate(value),
    },
    {
      title: 'Дата назначения фото',
      dataIndex: 'photo_date',
      key: 'photo_date',
      sorter: true,
      render: (value) => formatDate(value),
    },
    {
      title: 'Фотограф',
      dataIndex: 'photographer_name',
      key: 'photographer_name',
    },
    {
      title: 'Отснято/общее количество',
      key: 'taken_total',
      render: (text, record) => (
        `${record.taken_count}/${record.total_products}`
      )
    },
    {
      title: 'Проверено',
      key: 'checked',
      render: (text, record) => {
        const checked = record.taken_count - record.unchecked_count;
        return checked;
      }
    }
  ];

  return (
    <div style={{ marginLeft: '250px', padding: '20px' }}>
      <h1>Заявки фото 2.0</h1>
      <Space style={{ marginBottom: 16 }}>
        <Input
          placeholder="Поиск по номеру заявки или штрихкоду"
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          style={{ width: 400 }}
          onKeyDown={handleEnterPress}
        />
        <Button
          type="primary"
          icon={<SearchOutlined />}
          onClick={handleSearch}
        >
          Поиск
        </Button>
      </Space>
      <Table
        columns={columns}
        dataSource={requests}
        loading={loading}
        rowKey="RequestNumber"
        onChange={handleTableChange}
        pagination={{
          current: pagination.current,
          pageSize: pagination.pageSize,
          total: pagination.total,
          showSizeChanger: false
        }}
      />
    </div>
  );
};

export default FS_Manager_Request_list;
