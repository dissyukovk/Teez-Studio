import flet as ft
import requests
from config import API_BASE_URL

def show_login(page, user_data, update_user_info):
    """Окно логина."""
    username_field = ft.TextField(label="Логин", width=300)
    password_field = ft.TextField(label="Пароль", password=True, width=300)

    def on_login_submit(e):
        """Обработка логина."""
        login_url = f"{API_BASE_URL}/api/login/"
        user_info_url = f"{API_BASE_URL}/ft/user-info/"

        payload = {"username": username_field.value, "password": password_field.value}
        try:
            response = requests.post(login_url, json=payload)
            if response.status_code == 200:
                token = response.json().get("access")
                headers = {"Authorization": f"Bearer {token}"}
                user_info_response = requests.get(user_info_url, headers=headers)
                if user_info_response.status_code == 200:
                    user_info = user_info_response.json()
                    user_data["token"] = token
                    update_user_info(user_info)
                    page.views.pop()
                    page.update()
                else:
                    print("Ошибка получения данных пользователя")
            else:
                print("Неверный логин или пароль")
        except requests.RequestException as ex:
            print(f"Ошибка: {ex}")

    login_view = ft.View(
        "/login",
        controls=[
            ft.Column(
                [
                    ft.Text("Вход в Teez Studio 2.0", size=20, weight="bold"),
                    username_field,
                    password_field,
                    ft.ElevatedButton("Войти", on_click=on_login_submit),
                ],
                alignment="center",
                horizontal_alignment="center",
            )
        ],
        horizontal_alignment="center",
        vertical_alignment="center",
    )

    page.views.append(login_view)
    page.update()
