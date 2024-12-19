import flet as ft
import requests
from utils import show_snack_bar
from config import API_BASE_URL
from camera_state import camera_state

camera_ip = None  # Глобальная переменная для хранения IP камеры

def fetch_cameras(token):
    """Получение списка камер."""
    url = f"{API_BASE_URL}/ft/photographercamera/"
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.get(url, headers=headers)
    if response.status_code == 200:
        data = response.json()
        print("Полученные камеры:", data)
        return data
    else:
        print("Ошибка загрузки списка камер:", response.status_code)
        return []

def photographer_camera_page(token, page, content_container):
    """Страница выбора камеры для фотографа."""

    cameras = fetch_cameras(token)
    dropdown_ref = ft.Ref[ft.Dropdown]()

    def connect_camera(e):
        """Подключение к выбранной камере через CCAPI."""
        selected_camera_id = dropdown_ref.current.value
        if not selected_camera_id:
            show_snack_bar(page, "Выберите камеру для подключения")
            return

        camera_state.ip = next((camera["IP"] for camera in cameras if str(camera["id"]) == selected_camera_id), None)
        print(f"IP камеры обновлен: {camera_state.ip}")

        if not camera_state.ip:
            show_snack_bar(page, "Не удалось найти IP выбранной камеры")
            return

        url = f"http://{camera_state.ip}:8080/ccapi/ver100/deviceinformation"
        print(f"Пытаемся подключиться к камере по URL: {url}")

        try:
            response = requests.get(url)
            if response.status_code == 200:
                show_snack_bar(page, "Камера подключена")
            else:
                show_snack_bar(page, "Не удалось подключиться к камере")
        except Exception as ex:
            print(f"Ошибка подключения к камере: {ex}")
            show_snack_bar(page, f"Ошибка подключения: {ex}")

    content = ft.Column(
        controls=[
            ft.Text("Выберите камеру:", size=20, weight="bold"),
            ft.Dropdown(
                ref=dropdown_ref,
                label="Камеры",
                options=[
                    ft.dropdown.Option(key=str(camera["id"]), text=f"Камера {camera['id']} - {camera['IP']}")
                    for camera in cameras
                ],
                width=400,
            ),
            ft.ElevatedButton(
                text="Подключить",
                on_click=connect_camera,
                bgcolor="green",
                color="white",
            ),
        ],
        alignment=ft.MainAxisAlignment.START,
        horizontal_alignment=ft.CrossAxisAlignment.CENTER,
    )

    content_container.content = content
    page.update()
