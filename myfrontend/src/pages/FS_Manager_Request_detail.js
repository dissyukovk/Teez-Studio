import React, { useEffect, useState } from 'react';
import { Table, Button } from 'antd';
import { useParams } from 'react-router-dom';
import requestService from '../services/requestService';

const FS_Manager_Request_detail = () => {
  const { requestNumber } = useParams();
  const [requestDetail, setRequestDetail] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchRequestDetail = async () => {
    setLoading(true);
    try {
      const data = await requestService.getSPhotographerRequestDetail(requestNumber);
      setRequestDetail(data);
    } catch (error) {
      console.error('Failed to fetch request detail', error);
      setRequestDetail({ products: [] });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequestDetail();
  }, [requestNumber]);

  const columns = [
    {
      title: 'Штрихкод',
      dataIndex: 'barcode',
      key: 'barcode',
    },
    {
      title: 'Наименование',
      dataIndex: 'product_name',
      key: 'product_name',
    },
    {
      title: 'Категория',
      dataIndex: 'category_name',
      key: 'category_name',
    },
    {
      title: 'Референс',
      dataIndex: 'reference_link',
      key: 'reference_link',
      render: (text, record) => (
        record.reference_link ? (
          <Button type="link" href={record.reference_link} target="_blank">
            Открыть референс
          </Button>
        ) : null
      )
    },
    {
      title: 'Статус фото',
      dataIndex: 'photo_status_name',
      key: 'photo_status_name',
    },
    {
      title: 'Проверено',
      dataIndex: 'sphoto_status_name',
      key: 'sphoto_status_name',
    },
    {
      title: 'Фото',
      dataIndex: 'photos_link',
      key: 'photos_link',
      render: (text, record) => (
        record.photos_link ? (
          <Button type="link" href={record.photos_link} target="_blank">
            Смотреть фото
          </Button>
        ) : null
      )
    }
  ];

  return (
    <div style={{ marginLeft: '250px', padding: '20px' }}>
      <h1>Детали заявки {requestDetail?.RequestNumber}</h1>
      {requestDetail && (
        <div style={{ marginBottom: '20px' }}>
          <p><strong>Товаровед:</strong> {requestDetail.stockman_name}</p>
          <p><strong>Дата создания:</strong> {requestDetail.creation_date}</p>
          <p><strong>Фотограф:</strong> {requestDetail.photographer_name}</p>
          <p><strong>Дата назначения фото:</strong> {requestDetail.photo_date}</p>
        </div>
      )}

      <Table
        loading={loading}
        columns={columns}
        dataSource={requestDetail?.products || []}
        rowKey="barcode"
      />
    </div>
  );
};

export default FS_Manager_Request_detail;
