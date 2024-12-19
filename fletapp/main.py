import flet as ft
import requests
import json
from config import API_BASE_URL
from login import show_login
from photographer import photographer_requests_page
from nav_rail import create_nav_rail
from photographer_camera import photographer_camera_page, fetch_cameras

def main(page: ft.Page):
    global content_container

    user_data = {"token": None, "groups": [], "first_name": "", "last_name": "", "on_work": False}
    selected_index = 0

    page.theme_mode = ft.ThemeMode.DARK

    def toggle_theme(e):
        """Переключение темы между светлой и темной."""
        page.theme_mode = ft.ThemeMode.LIGHT if page.theme_mode == ft.ThemeMode.DARK else ft.ThemeMode.DARK
        page.update()

    def is_photographer():
        """Проверяет, является ли пользователь фотографом."""
        return "Фотограф" in user_data.get("groups", [])

    def update_page_content(index):
        """Обновляет содержимое страницы в зависимости от выбранного пункта."""
        if index == 0:
            content_container.content = ft.Text("Главная страница", size=18)
        elif index == 1 and is_photographer():
            photographer_camera_page(user_data["token"], page, content_container)  # Переход на страницу выбора камеры
        elif index == 2 and is_photographer():
            photographer_requests_page(user_data["token"], page, content_container)
        else:
            content_container.content = ft.Text("Страница недоступна", size=18)
        page.update()

    def create_user_tile():
        """Создает раскрывающийся блок с кнопками."""
        expanded = False  # Состояние раскрытия

        def toggle_expansion(e):
            """Переключение состояния раскрытия."""
            nonlocal expanded
            expanded = not expanded  # Меняем состояние
            update_toggle_content()  # Обновляем содержимое

        def toggle_on_work(e):
            """Переключение смены."""
            new_status = not user_data["on_work"]
            try:
                response = requests.patch(
                    f"{API_BASE_URL}/ft/user/on-work/",
                    json={"on_work": new_status},
                    headers={"Authorization": f"Bearer {user_data.get('token')}"}
                )
                if response.status_code == 200:
                    user_data["on_work"] = response.json().get("on_work", False)
                    on_work_button.text = "Завершить смену" if user_data["on_work"] else "Начать смену"
                    on_work_button.bgcolor = "yellow" if user_data["on_work"] else "green"
                    on_work_button.update()
                else:
                    print("Ошибка обновления смены:", response.status_code, response.json())
            except Exception as ex:
                print("Ошибка при обновлении смены:", ex)

        def logout_handler(e):
            """Обработчик выхода."""
            user_data.clear()
            page.controls.clear()
            page.add(ft.Text("Вы вышли из системы", size=18))
            page.update()

        on_work_button = ft.ElevatedButton(
            text="Завершить смену" if user_data["on_work"] else "Начать смену",
            bgcolor="yellow" if user_data["on_work"] else "green",
            color="black",
            on_click=toggle_on_work,
        )

        logout_button = ft.ElevatedButton(
            text="Выйти",
            bgcolor="red",
            color="white",
            on_click=logout_handler,
        )

        toggle_content = ft.Column(
            controls=[],
            visible=False,
            spacing=10,
        )

        def update_toggle_content():
            """Обновляет состояние отображения кнопок."""
            if expanded:
                toggle_content.controls = [on_work_button, logout_button]
                toggle_content.visible = True
            else:
                toggle_content.controls = []
                toggle_content.visible = False
            toggle_content.update()

        return ft.Container(
            content=ft.Column(
                controls=[
                    ft.TextButton(
                        text=f"{user_data['first_name']} {user_data['last_name']}",
                        on_click=toggle_expansion,
                    ),
                    toggle_content,
                ],
                spacing=10,
            )
        )

    def create_nav_items():
        """Создает список пунктов навигации с учетом роли пользователя."""
        nav_items = [ft.NavigationRailDestination(icon=ft.Icons.HOME, label="Главная")]
        if is_photographer():
            nav_items.extend([
                ft.NavigationRailDestination(icon=ft.Icons.CAMERA_ALT, label="Камера"),
                ft.NavigationRailDestination(icon=ft.Icons.LIST, label="Текущие заявки"),
            ])
        return nav_items

    nav_rail_container = create_nav_rail(
        page=page,
        selected_index=selected_index,
        update_content=update_page_content,
        toggle_theme=toggle_theme,
        create_user_tile=create_user_tile,
    )

    content_container = ft.Container(
        content=ft.Text("Главная страница", size=18),
        expand=True,
    )

    page.add(
        ft.Row(
            [
                nav_rail_container,
                content_container,
            ],
            alignment=ft.MainAxisAlignment.START,
            vertical_alignment=ft.CrossAxisAlignment.START,
            expand=True,
        )
    )

    def update_user_info(user_info):
        """Обновляет информацию о пользователе."""
        print("Обновление информации о пользователе:", user_info)  # Логируем данные
        user_data.update(user_info)
        print("Группы пользователя:", user_data.get("groups"))  # Проверяем группы
        nav_rail_container.content.destinations = create_nav_items()  # Обновляем навигацию
        page.update()

    show_login(page, user_data, update_user_info)


ft.app(target=main)
