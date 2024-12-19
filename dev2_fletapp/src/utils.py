import flet as ft

def show_snack_bar(page, message):
    """Показать уведомление пользователю."""
    snack_bar = ft.SnackBar(ft.Text(message))
    page.overlay.append(snack_bar)
    snack_bar.open = True
    page.update()
