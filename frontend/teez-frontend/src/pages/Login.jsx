// src/pages/Login.jsx
import React from 'react';
import { Form, Input, Button, Typography, message } from 'antd';
import axios from 'axios';
import { API_BASE_URL } from '../utils/config';

const { Title } = Typography;

const Login = () => {
  const onFinish = (values) => {
    axios
      .post(`${API_BASE_URL}/api/login/`, values)
      .then((response) => {
        localStorage.setItem('accessToken', response.data.access);
        localStorage.setItem('refreshToken', response.data.refresh);
        message.success('Успешный вход');
        window.location.href = "/";
      })
      .catch((error) => {
        message.error('Ошибка входа');
        console.error(error);
      });
  };

  return (
    <div style={{ maxWidth: '400px', margin: '100px auto' }}>
      <Title level={2} style={{ textAlign: 'center' }}>Вход</Title>
      <Form name="login" onFinish={onFinish}>
        <Form.Item
          name="username"
          rules={[{ required: true, message: 'Введите логин' }]}
        >
          <Input placeholder="Логин" />
        </Form.Item>
        <Form.Item
          name="password"
          rules={[{ required: true, message: 'Введите пароль' }]}
        >
          <Input.Password placeholder="Пароль" />
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit" block>
            Войти
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
};

export default Login;
