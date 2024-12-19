import flet as ft
import requests

API_BASE_URL = "http://192.168.6.49:8000"

def main(page: ft.Page):
    # Состояние пользователя
    user_data = {"token": None, "groups": [], "first_name": "", "last_name": ""}

    # Установка темы
    page.theme_mode = ft.ThemeMode.DARK

    def toggle_theme(e):
        """Переключение темы между светлой и темной."""
        page.theme_mode = ft.ThemeMode.LIGHT if page.theme_mode == ft.ThemeMode.DARK else ft.ThemeMode.DARK
        page.update()

    def show_snack_bar(message):
        """Отображение сообщения пользователю."""
        snack_bar = ft.SnackBar(ft.Text(message))
        page.overlay.append(snack_bar)
        snack_bar.open = True
        page.update()

    def on_login_submit(e):
        """Обработка логина пользователя через API Django."""
        login_url = f"{API_BASE_URL}/api/login/"
        user_info_url = f"{API_BASE_URL}/ft/user-info/"

        payload = {
            "username": username_field.value,
            "password": password_field.value,
        }

        try:
            # Отправляем запрос на получение токенов
            response = requests.post(login_url, json=payload)
            if response.status_code == 200:
                tokens = response.json()
                user_data["token"] = tokens["access"]

                # Получаем информацию о пользователе
                headers = {"Authorization": f"Bearer {user_data['token']}"}
                user_info_response = requests.get(user_info_url, headers=headers)

                if user_info_response.status_code == 200:
                    user_info = user_info_response.json()
                    user_data["groups"] = user_info["groups"]
                    user_data["first_name"] = user_info["first_name"]
                    user_data["last_name"] = user_info["last_name"]

                    show_snack_bar("Успешный вход!")
                    show_main_app()
                else:
                    show_snack_bar("Ошибка получения данных пользователя")
            else:
                show_snack_bar("Неверный логин или пароль")

        except requests.RequestException as ex:
            show_snack_bar(f"Ошибка: {ex}")

    def show_login():
        """Окно логина."""
        page.views.clear()

        # Поля для ввода логина и пароля
        global username_field, password_field
        username_field = ft.TextField(label="Логин", width=300)
        password_field = ft.TextField(label="Пароль", password=True, width=300)

        # Экран логина
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

    def show_main_app():
        """Основное приложение."""
        page.views.clear()

        # Создание пунктов навигации
        nav_items = [
            ft.Row(
                [
                    ft.Icon(ft.Icons.HOME, size=20),
                    ft.Text("Главная", size=16),
                ],
                alignment="start",
            ),
        ]

        if "Фотограф" in user_data["groups"]:
            nav_items += [
                ft.Row(
                    [
                        ft.Icon(ft.Icons.CAMERA_ALT, size=20),
                        ft.Text("Камера", size=16),
                    ],
                    alignment="start",
                ),
                ft.Row(
                    [
                        ft.Icon(ft.Icons.LIST, size=20),
                        ft.Text("Текущие заявки", size=16),
                    ],
                    alignment="start",
                ),
            ]

        # Верхняя часть наврейла
        leading_content = ft.Column(
            [
                ft.Text("Teez Studio 2.0", size=16, weight="bold", color="#B5FF86"),
                ft.IconButton(
                    icon=ft.Icons.LIGHT_MODE,
                    tooltip="Переключить тему",
                    on_click=toggle_theme,
                ),
            ],
            alignment="start",
            spacing=10,
        )

        # Нижняя часть наврейла (имя пользователя)
        trailing_content = ft.Container(
            content=ft.Text(
                f"{user_data['first_name']} {user_data['last_name']}",
                size=14,
                weight="bold",
                color="white",
                text_align="center",
            ),
            alignment=ft.alignment.bottom_left,
            padding=ft.padding.only(bottom=10, left=10),
        )

        # Навигационный рельс
        nav_rail = ft.Column(
            controls=[
                leading_content,
                *nav_items,
                ft.Container(expand=True),  # Заполнитель для верхней части
                trailing_content,
            ],
            expand=True,
            spacing=15,
        )

        # Обернуть рельс в Container с правой границей и фиксированной шириной
        nav_rail_with_border = ft.Container(
            content=nav_rail,
            border=ft.border.only(right=ft.BorderSide(1, ft.colors.GREY)),
            width=200,  # Увеличенная ширина для полного отображения текста
        )

        # Основной макет
        main_view = ft.View(
            "/main",
            controls=[
                ft.Row(
                    [
                        nav_rail_with_border,
                        ft.Container(content=ft.Text("Содержимое страницы"), expand=True),
                    ],
                    expand=True,  # Заставляет `Row` занять всё доступное пространство
                )
            ],
        )

        page.views.append(main_view)
        page.update()

    # Установка начальной страницы
    show_login()


# Запуск приложения
ft.app(target=main)
