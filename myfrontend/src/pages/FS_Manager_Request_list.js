import React, { useEffect, useState } from 'react';
import { Table, Input, Button, Space } from 'antd';
import { useNavigate } from 'react-router-dom';
import requestService from '../services/requestService';
import { SearchOutlined } from '@ant-design/icons';

const FS_Manager_Request_list = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchRequestNumber, setSearchRequestNumber] = useState('');
  const [searchBarcode, setSearchBarcode] = useState('');
  const [sortField, setSortField] = useState('');
  const [sortOrder, setSortOrder] = useState('asc');

  const navigate = useNavigate();

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const data = await requestService.getSPhotographerRequests({
        requestNumber: searchRequestNumber,
        barcode: searchBarcode,
        sortField,
        sortOrder
      });
      // data уже массив после адаптации в сервисе
      setRequests(data);
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
  }, [sortField, sortOrder]);

  const handleSearch = () => {
    fetchRequests();
  };

  const handleTableChange = (pagination, filters, sorter) => {
    if (sorter.field) {
      setSortField(sorter.field);
      setSortOrder(sorter.order === 'ascend' ? 'asc' : 'desc');
    }
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
    },
    {
      title: 'Дата назначения фото',
      dataIndex: 'photo_date',
      key: 'photo_date',
      sorter: true,
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
          placeholder="Поиск по номеру заявки"
          value={searchRequestNumber}
          onChange={(e) => setSearchRequestNumber(e.target.value)}
          style={{ width: 200 }}
        />
        <Input
          placeholder="Поиск по штрихкоду"
          value={searchBarcode}
          onChange={(e) => setSearchBarcode(e.target.value)}
          style={{ width: 200 }}
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
        pagination={false}
      />
    </div>
  );
};

export default FS_Manager_Request_list;
