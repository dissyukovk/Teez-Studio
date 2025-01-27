import React, { useState, useEffect } from 'react';
import { Table, Input, Button, Space, DatePicker, message } from 'antd';
import axios from 'axios';
import * as XLSX from 'xlsx';
import dayjs from 'dayjs'; // Библиотека для форматирования дат

const { RangePicker } = DatePicker;
const { TextArea } = Input;

const NofotoPage = () => {
  // Данные для таблицы
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  // Параметры фильтра
  // Многострочный ввод для штрихкодов
  const [barcodesMulti, setBarcodesMulti] = useState('');
  // Поиск по магазину (seller)
  const [seller, setSeller] = useState('');
  // Дата "от" и "до"
  const [dateRange, setDateRange] = useState([]);

  // Параметры сортировки/пагинации
  const [ordering, setOrdering] = useState('-date');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [totalCount, setTotalCount] = useState(0);

  // Колонки таблицы
  const columns = [
    {
      title: 'Штрихкод',
      dataIndex: 'barcode',
      key: 'barcode',
      sorter: true,
    },
    {
      title: 'Наименование',
      dataIndex: 'name',
      key: 'name',
      sorter: true,
    },
    {
      title: 'Магазин',
      dataIndex: 'shop',
      key: 'shop',
      sorter: true,
    },
    {
      title: 'Дата',
      dataIndex: 'date',
      key: 'date',
      sorter: true,
      render: (value) => {
        if (!value) return '-';
        return dayjs(value).format('YYYY-MM-DD HH:mm');
      },
    },
  ];

  // Маппинг полей фронта -> полей для ordering в DRF
  const orderingMap = {
    barcode: 'product__barcode',
    name: 'product__name',
    shop: 'product__seller',
    date: 'date',
  };

  // Функция для загрузки данных
  const fetchData = async (page = 1, size = 50, order = '-date') => {
    setLoading(true);
    try {
      const params = {
        page,
        page_size: size,
        ordering: order,
      };

      // Если пользователь ввёл несколько штрихкодов
      if (barcodesMulti.trim()) {
        const lines = barcodesMulti
          .split('\n')
          .map((l) => l.trim())
          .filter(Boolean);
        params.barcodes = lines.join(',');
      }

      // Фильтр по магазину
      if (seller.trim()) {
        params['product__seller'] = seller.trim();
      }

      // Фильтр по дате "от ... до ..."
      if (dateRange.length === 2) {
        const [start, end] = dateRange;
        params.start_date = start.format('YYYY-MM-DD');
        params.end_date = end.format('YYYY-MM-DD');
      }

      const response = await axios.get('http://192.168.7.230:8000/nofoto_list/', {
        params,
      });
      const results = response.data.results || [];

      setData(
        results.map((item) => ({
          key: item.id,
          barcode: item.barcode,
          name: item.name,
          shop: item.shop,
          date: item.date,
        }))
      );

      setTotalCount(response.data.count || 0);
      setCurrentPage(page);
      setPageSize(size);
    } catch (error) {
      console.error('Error loading data:', error);
      message.error('Ошибка загрузки данных');
    } finally {
      setLoading(false);
    }
  };

  // Первый рендер: загружаем данные
  useEffect(() => {
    fetchData(currentPage, pageSize, ordering);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Обработка изменения таблицы (сортировка, пагинация)
  const handleTableChange = (pagination, filters, sorter) => {
    let newOrdering = ordering;
    if (sorter.field) {
      const drfField = orderingMap[sorter.field] || sorter.field;
      newOrdering = sorter.order === 'descend' ? `-${drfField}` : drfField;
    }
    fetchData(pagination.current, pagination.pageSize, newOrdering);
  };

  // Кнопка "Поиск/Фильтр"
  const handleSearch = () => {
    fetchData(1, pageSize, ordering);
  };

  // Кнопка "Экспорт в Excel"
  const handleExportExcel = async () => {
    try {
      // Загрузим все данные (page_size=100000)
      const params = {
        page_size: 100000,
        ordering,
      };

      if (barcodesMulti.trim()) {
        const lines = barcodesMulti
          .split('\n')
          .map((l) => l.trim())
          .filter(Boolean);
        params.barcodes = lines.join(',');
      }
      if (seller.trim()) {
        params['product__seller'] = seller.trim();
      }
      if (dateRange.length === 2) {
        const [start, end] = dateRange;
        params.start_date = start.format('YYYY-MM-DD');
        params.end_date = end.format('YYYY-MM-DD');
      }

      const resp = await axios.get('http://192.168.7.230:8000/nofoto_list/', { params });
      const allResults = resp.data.results || [];

      // Формируем данные для Excel — форматируем дату так же, как в колонке
      const wsData = allResults.map((item) => ({
        'Штрихкод': Number(item.barcode) || item.barcode,
        'Наименование': item.name || '',
        'Магазин': item.shop || '',
        // Если item.date есть, форматируем
        'Дата': item.date
          ? dayjs(item.date).format('YYYY-MM-DD HH:mm')
          : '',
      }));

      const worksheet = XLSX.utils.json_to_sheet(wsData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Nofoto');

      const now = new Date();
      const fileName = `nofoto_${now
        .toISOString()
        .slice(0, 19)
        .replace('T', '_')
        .replace(/:/g, '-')}.xlsx`;
      XLSX.writeFile(workbook, fileName);

      message.success('Файл Excel сформирован');
    } catch (error) {
      console.error('Excel export error:', error);
      message.error('Ошибка экспорта в Excel');
    }
  };

  return (
    <div style={{ padding: 16 }}>
      <h2>Список Nofoto</h2>

      <Space style={{ marginBottom: 16 }} align="start">
        <TextArea
          placeholder="Штрихкоды (каждый в новой строке)"
          value={barcodesMulti}
          onChange={(e) => setBarcodesMulti(e.target.value)}
          style={{ width: 200 }}
          rows={4}
        />

        <Input
          placeholder="Магазин"
          value={seller}
          onChange={(e) => setSeller(e.target.value)}
          style={{ width: 120 }}
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

      <Table
        columns={columns}
        dataSource={data}
        loading={loading}
        onChange={handleTableChange}
        pagination={{
          current: currentPage,
          pageSize,
          total: totalCount,
          showSizeChanger: true,
        }}
      />
    </div>
  );
};

export default NofotoPage;
