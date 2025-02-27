import React, { useState, useEffect, useCallback } from 'react';
import { Layout, Table, Input, Button, Space, DatePicker, Pagination, message } from 'antd';
import Sidebar from '../../components/Layout/Sidebar';
import axios from 'axios';
import * as XLSX from 'xlsx';
import dayjs from 'dayjs';
import { API_BASE_URL } from '../../utils/config';

const { Content } = Layout;
const { RangePicker } = DatePicker;
const { TextArea } = Input;

const DefectOperationsPage = ({ darkMode, setDarkMode }) => {
  useEffect(() => {
    document.title = 'Список браков';
  }, []);

  // Состояния для данных и фильтров
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [barcodesMulti, setBarcodesMulti] = useState('');
  const [productName, setProductName] = useState('');
  const [dateRange, setDateRange] = useState([]);
  const [ordering, setOrdering] = useState('-date');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [totalCount, setTotalCount] = useState(0);

  // Определение колонок таблицы
  const columns = [
    {
      title: 'Штрихкод',
      dataIndex: 'barcode',
      key: 'barcode',
      sorter: true,
    },
    {
      title: 'Наименование',
      dataIndex: 'product_name',
      key: 'product_name',
      sorter: true,
    },
    {
      title: 'Пользователь',
      dataIndex: 'user_full_name',
      key: 'user_full_name',
      sorter: true,
    },
    {
      title: 'Дата',
      dataIndex: 'date',
      key: 'date',
      sorter: true,
      render: (value) => (value ? dayjs(value).format('YYYY-MM-DD HH:mm') : '-'),
    },
    {
      title: 'Комментарий',
      dataIndex: 'comment',
      key: 'comment',
    },
    {
      title: 'Тип операции',
      dataIndex: 'operation_type_name',
      key: 'operation_type_name',
    },
    {
      title: 'Магазин',
      dataIndex: 'seller',
      key: 'seller',
    }
  ];

  // Маппинг полей сортировки: фронтенд → DRF
  const orderingMap = {
    barcode: 'product__barcode',
    product_name: 'product__name',
    user_full_name: 'user_full_name',
    date: 'date',
  };

  // Функция для загрузки данных с сервера
  const fetchData = useCallback(async (page, size, order) => {
    setLoading(true);
    try {
      const params = {
        page,
        page_size: size,
        sort_field: order.startsWith('-') ? order.slice(1) : order,
        sort_order: order.startsWith('-') ? 'desc' : 'asc',
      };

      // Фильтр по штрихкодам (множественный ввод, каждый с новой строки)
      if (barcodesMulti.trim()) {
        const lines = barcodesMulti.split('\n').map(l => l.trim()).filter(Boolean);
        params.barcode = lines.join(',');
      }

      // Фильтр по наименованию товара
      if (productName.trim()) {
        params.name = productName.trim();
      }

      // Фильтрация по диапазону дат
      if (dateRange.length === 2) {
        const [start, end] = dateRange;
        params.start_date = start.format('YYYY-MM-DD');
        params.end_date = end.format('YYYY-MM-DD');
      }

      const response = await axios.get(`${API_BASE_URL}/public/defect-operations/`, { params });
      const results = response.data.results || [];
      setData(results.map((item, index) => ({ key: index, ...item })));
      setTotalCount(response.data.count || 0);
      setCurrentPage(page);
      setPageSize(size);
    } catch (error) {
      console.error('Ошибка загрузки данных:', error);
      message.error('Ошибка загрузки данных');
    } finally {
      setLoading(false);
    }
  }, [barcodesMulti, productName, dateRange]);

  // Загрузка данных при первом монтировании компонента
  useEffect(() => {
    fetchData(1, pageSize, ordering);
  }, []); // только один раз при загрузке

  // Обработка изменений сортировки в таблице: изменяем только состояние ordering
  const handleTableChange = (pagination, filters, sorter) => {
    if (sorter.field) {
      const drfField = orderingMap[sorter.field] || sorter.field;
      const newOrdering = sorter.order === 'descend' ? `-${drfField}` : drfField;
      setOrdering(newOrdering);
    }
  };

  // Обработка смены страницы и/или количества записей: изменяем состояние, но не вызываем fetchData
  const handlePageChange = (page, size) => {
    setCurrentPage(page);
    setPageSize(size);
  };

  // По нажатию на кнопку «Поиск» выполняется запрос с текущими параметрами.
  const handleSearch = () => {
    // Можно сбросить страницу на первую при новом поиске
    setCurrentPage(1);
    fetchData(1, pageSize, ordering);
  };

  // Экспорт данных в Excel (использует те же фильтры, что и поиск)
  const handleExportExcel = async () => {
    try {
      const params = {
        page_size: 500000,
        sort_field: ordering.startsWith('-') ? ordering.slice(1) : ordering,
        sort_order: ordering.startsWith('-') ? 'desc' : 'asc',
      };

      if (barcodesMulti.trim()) {
        const lines = barcodesMulti.split('\n').map(l => l.trim()).filter(Boolean);
        params.barcode = lines.join(',');
      }

      if (productName.trim()) {
        params.name = productName.trim();
      }

      if (dateRange.length === 2) {
        const [start, end] = dateRange;
        params.start_date = start.format('YYYY-MM-DD');
        params.end_date = end.format('YYYY-MM-DD');
      }

      const resp = await axios.get(`${API_BASE_URL}/public/defect-operations/`, { params });
      const allResults = resp.data.results || [];
      const wsData = allResults.map(item => ({
        'Штрихкод': item.barcode,
        'Наименование': item.product_name,
        'Пользователь': item.user_full_name,
        'Дата': item.date ? dayjs(item.date).format('YYYY-MM-DD HH:mm') : '',
        'Комментарий': item.comment,
        'Тип операции': item.operation_type_name,
        'Магазин': item.seller,
      }));
      const worksheet = XLSX.utils.json_to_sheet(wsData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Defects');
      const now = new Date();
      const fileName = `defect_operations_${now.toISOString().slice(0, 19).replace('T', '_').replace(/:/g, '-')}.xlsx`;
      XLSX.writeFile(workbook, fileName);
      message.success('Файл Excel сформирован');
    } catch (error) {
      console.error('Ошибка экспорта в Excel:', error);
      message.error('Ошибка экспорта в Excel');
    }
  };

  return (
    <Layout>
      <Sidebar darkMode={darkMode} setDarkMode={setDarkMode} />
      <Content style={{ padding: 16 }}>
        <h2>Список браков</h2>
        <Space style={{ marginBottom: 16 }} align="start">
          <TextArea
            placeholder="Штрихкоды (каждый в новой строке)"
            value={barcodesMulti}
            onChange={(e) => setBarcodesMulti(e.target.value)}
            style={{ width: 200 }}
            rows={4}
          />
          <Input
            placeholder="Наименование товара"
            value={productName}
            onChange={(e) => setProductName(e.target.value)}
            style={{ width: 200 }}
          />
          <RangePicker
            format="YYYY-MM-DD"
            value={dateRange}
            onChange={(values) => setDateRange(values || [])}
          />
          <Button type="primary" onClick={handleSearch}>
            Поиск
          </Button>
          <Button onClick={handleExportExcel}>Скачать Excel</Button>
        </Space>
        <Pagination
          current={currentPage}
          pageSize={pageSize}
          total={totalCount}
          onChange={handlePageChange}
          showSizeChanger
          onShowSizeChange={handlePageChange}
          showTotal={(total) => `Всего ${total} записей`}
          style={{ marginBottom: 16 }}
        />
        <Table
          columns={columns}
          dataSource={data}
          loading={loading}
          onChange={handleTableChange}
          pagination={false}
        />
      </Content>
    </Layout>
  );
};

export default DefectOperationsPage;
