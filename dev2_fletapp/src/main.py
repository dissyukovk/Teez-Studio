import flet as ft
import requests
from config import API_BASE_URL
from login import show_login
from photographer import photographer_requests_page
from nav_rail import create_nav_rail
from photographer_camera import photographer_camera_page

# Импортируем новые страницы старшего фотографа
from SPH_assign_requests import sph_assign_requests_page
from SPH_on_shoot import sph_on_shoot_page
from SPH_all_requests import sph_all_requests_page
from SPH_request_detail import sph_request_detail_page


def main(page: ft.Page):
    page.title = "Studio 2.0"
    page.window_icon_path = "teez_logo_64.ico"
    user_data = {"token": None, "groups": [], "first_name": "", "last_name": "", "on_work": False}
    nav_rail_container = None
    content_container = None


    def toggle_theme(e):
        page.theme_mode = ft.ThemeMode.LIGHT if page.theme_mode == ft.ThemeMode.DARK else ft.ThemeMode.DARK
        page.update()

    def is_photographer():
        return "Фотограф" in user_data.get("groups", [])

    def is_senior_photographer():
        return "Старший фотограф" in user_data.get("groups", [])

    def update_page_content(index):
        # Логика навигации
        # Предположим, что индексы навигации:
        # 0 - Главная
        # 1 - если фотограф: Камера
        # 2 - если фотограф: Заявки фотографа
        # Если старший фотограф: добавим еще пункты:
        # 3 - Распределить заявки (статус=2)
        # 4 - На съемке (статус=3)
        # 5 - Все заявки
        if index == 0:
            content_container.content = ft.Text("Главная страница", size=18)
        elif index == 1 and is_photographer():
            photographer_camera_page(user_data["token"], page, content_container)
        elif index == 2 and is_photographer():
            photographer_requests_page(user_data["token"], page, content_container, user_data)
        elif index == 3 and is_senior_photographer():
            sph_assign_requests_page(user_data["token"], page, content_container, user_data)
        elif index == 4 and is_senior_photographer():
            sph_on_shoot_page(user_data["token"], page, content_container, user_data)
        elif index == 5 and is_senior_photographer():
            sph_all_requests_page(user_data["token"], page, content_container, user_data)
        else:
            content_container.content = ft.Text("Страница недоступна", size=18)
        page.update()

    def initialize_interface():
        print("Отладка: группы пользователя:", user_data.get("groups", []))
        print("is_senior_photographer:", is_senior_photographer())
        nonlocal nav_rail_container, content_container

        nav_items = [
            ft.NavigationRailDestination(icon=ft.Icons.HOME, label="Главная")
        ]

        # Если фотограф
        if is_photographer():
            nav_items.append(ft.NavigationRailDestination(icon=ft.Icons.CAMERA, label="Камера"))
            nav_items.append(ft.NavigationRailDestination(icon=ft.Icons.LIST, label="Мои заявки"))

        # Если старший фотограф
        if is_senior_photographer():
            nav_items.append(ft.NavigationRailDestination(icon=ft.Icons.ASSIGNMENT_IND, label="Распределить заявки"))
            nav_items.append(ft.NavigationRailDestination(icon=ft.Icons.CAMERA_ENHANCE, label="На съемке"))
            nav_items.append(ft.NavigationRailDestination(icon=ft.Icons.VIEW_LIST, label="Все заявки"))

        nav_rail_container = create_nav_rail(
            page=page,
            selected_index=0,
            update_content=update_page_content,
            toggle_theme=toggle_theme,
            create_user_tile=create_user_tile,
            nav_items=nav_items
        )

        content_container = ft.Container(
            content=ft.Text("Главная страница", size=18),
            expand=True,
        )

        page.controls.clear()
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
        page.update()

    def create_user_tile():
        expanded = False

        def toggle_expansion(e):
            nonlocal expanded
            expanded = not expanded
            update_toggle_content()

        def toggle_on_work(e):
            new_status = not user_data["on_work"]
            try:
                response = requests.patch(
                    f"{API_BASE_URL}/ft/user/on-work/",
                    json={"on_work": new_status},
                    headers={"Authorization": f"Bearer {user_data.get('token')}"}
                )
                if response.status_code == 200:
                    user_data["on_work"] = response.json().get("on_work", False)
                    update_user_tile_buttons()
            except Exception as ex:
                print(f"[ERROR] toggle_on_work: {ex}")

        def update_user_tile_buttons():
            on_work_button.text = "Завершить смену" if user_data["on_work"] else "Начать смену"
            on_work_button.bgcolor = "yellow" if user_data["on_work"] else "green"
            on_work_button.update()

        user_name_text = f"{user_data['first_name']} {user_data['last_name']}" if user_data[
            'first_name'] else "Загрузка..."

        user_name_button = ft.TextButton(
            text=user_name_text,
            on_click=toggle_expansion,
            style=ft.ButtonStyle(padding=ft.Padding(10, 0, 10, 0)),
        )

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
            on_click=lambda e: page.go("/logout"),
        )

        toggle_content = ft.Column(
            controls=[],
            visible=False,
            spacing=10,
        )

        def update_toggle_content():
            toggle_content.controls = [on_work_button, logout_button] if expanded else []
            toggle_content.visible = expanded
            toggle_content.update()

        user_tile = ft.Container(
            content=ft.Column(
                controls=[
                    user_name_button,
                    toggle_content,
                ],
                spacing=10,
            ),
            width=200,
            padding=ft.Padding(10, 10, 10, 10),
        )

        return user_tile

    def update_user_info(user_info):
        user_data.update(user_info)
        print("Отладка: user_data:", user_data)  # Посмотреть, что в user_data['groups']
        initialize_interface()

    show_login(page, user_data, update_user_info)


ft.app(target=main)
