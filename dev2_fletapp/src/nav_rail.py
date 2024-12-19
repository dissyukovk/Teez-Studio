import flet as ft

def create_nav_rail(page, selected_index, update_content, toggle_theme, create_user_tile, nav_items):
    """Создает навигационный рельс (nav rail)."""

    def on_nav_change(e):
        """Обрабатывает переключение пунктов навигации."""
        nonlocal selected_index
        selected_index = e.control.selected_index
        update_content(selected_index)

    # Удаляем или комментируем update_nav_items(), так как теперь у нас есть nav_items
    # def update_nav_items():
    #     return [
    #         ft.NavigationRailDestination(
    #             icon=ft.Icons.HOME,
    #             label="Главная",
    #         ),
    #         ft.NavigationRailDestination(
    #             icon=ft.Icons.CAMERA_ALT,
    #             label="Камера",
    #         ),
    #         ft.NavigationRailDestination(
    #             icon=ft.Icons.LIST,
    #             label="Текущие заявки",
    #         ),
    #     ]

    return ft.Container(
        content=ft.NavigationRail(
            selected_index=selected_index,
            # Используем nav_items, которые мы передали извне
            destinations=nav_items,
            leading=ft.Container(
                content=ft.Row(
                    controls=[
                        ft.Text("Teez Studio 2.0", size=16, weight="bold", color="#B5FF86"),
                        ft.IconButton(
                            icon=ft.Icons.LIGHT_MODE,
                            tooltip="Переключить тему",
                            on_click=toggle_theme,
                        ),
                    ],
                    alignment="spaceBetween",
                    spacing=10,
                ),
                padding=ft.padding.all(15),
            ),
            trailing=create_user_tile(),  # Отображение информации о пользователе
            on_change=on_nav_change,
            label_type=ft.NavigationRailLabelType.ALL,
            expand=False,
        ),
        border=ft.border.only(right=ft.BorderSide(1, ft.Colors.BLUE_GREY_700)),
        width=200,  # Ширина наврейла
        alignment=ft.alignment.top_left,
        expand=False,
    )
