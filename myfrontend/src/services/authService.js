const authService = {
  async login(username, password) {
    try {
      const response = await fetch('http://192.168.6.229:8000/api/token/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        const errorMessage = await response.text(); // Получаем текст ошибки
        throw new Error(`Failed to login: ${errorMessage}`);
      }

      const data = await response.json();
      console.log("Login successful:", data);  // Логируем успешный вход

      // Сохраняем токены в localStorage
      localStorage.setItem('token', data.access);
      localStorage.setItem('refreshToken', data.refresh);

      return data;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  },

  async logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    window.location.href = '/login'; // Перенаправляем на страницу входа после выхода
  },

  async getCurrentUserId() {
    try {
      const userData = await this.getUserData(); // Запрашиваем данные пользователя
      return userData.id;  // Возвращаем id пользователя
    } catch (error) {
      console.error('Ошибка при получении ID пользователя:', error);
      return null;
    }
  },

// Функция для получения данных пользователя
async getUserData() {
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('No token found');
  }

  try {
    const response = await fetch('http://192.168.6.229:8000/api/user/', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (response.status === 401) {
      console.warn("Token expired, attempting to refresh...");
      try {
        await this.refreshToken();
        return this.getUserData();  // Retry after refreshing the token
      } catch (refreshError) {
        this.logout();
        throw new Error('Unauthorized: token refresh failed');
      }
    }

    if (!response.ok) {
      const errorMessage = await response.text();
      throw new Error(`Failed to fetch user data: ${errorMessage}`);
    }

    const userData = await response.json();
    console.log("Fetched user data:", userData);

    // Store user_id in localStorage
    localStorage.setItem('user_id', userData.id);

    return userData;
  } catch (error) {
    console.error('Failed to fetch user data:', error);
    throw error;
  }
},

  // Automatically refresh token when needed
async refreshToken() {
  const refreshToken = localStorage.getItem('refreshToken');
  if (!refreshToken) {
    throw new Error('No refresh token found');
  }

  try {
    const response = await fetch('http://192.168.6.229:8000/api/token/refresh/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refresh: refreshToken }),
    });

    if (!response.ok) {
      const errorMessage = await response.text();
      throw new Error(`Failed to refresh token: ${errorMessage}`);
    }

    const data = await response.json();
    localStorage.setItem('token', data.access);
    return data.access;
  } catch (error) {
    console.error('Refresh token error:', error);
    throw error;
  }
}

};

export default authService;
