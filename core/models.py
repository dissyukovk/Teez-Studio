from django.db import models
from django.contrib.auth.models import User

class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    telegram_name = models.CharField(max_length=255, blank=True, null=True, verbose_name="Telegram Username")
    telegram_id = models.CharField(max_length=255, blank=True, null=True, verbose_name="Telegram ID")
    phone_number = models.CharField(max_length=15, blank=True, null=True, verbose_name="Phone Number")
    birth_date = models.DateField(blank=True, null=True, verbose_name="Date of Birth")
    on_work = models.BooleanField(default=False, verbose_name="Is On Work")

    def __str__(self):
        return f"Profile of {self.user.username}"

# Модель для статусов заявок
class STRequestStatus(models.Model):
    name = models.CharField(max_length=255)

    def __str__(self):
        return self.name

# Модель заявки
class STRequest(models.Model):
    RequestNumber = models.CharField(max_length=13, unique=True)
    photographer = models.ForeignKey(User, on_delete=models.SET_NULL, related_name='photographer_requests', blank=True, null=True)
    retoucher = models.ForeignKey(User, on_delete=models.SET_NULL, related_name='retoucher_requests', blank=True, null=True)
    stockman = models.ForeignKey(User, on_delete=models.SET_NULL, related_name='stockman_requests', blank=True, null=True)
    creation_date = models.DateTimeField(auto_now_add=True)
    status = models.ForeignKey(STRequestStatus, on_delete=models.SET_NULL, null=True)
    s_ph_comment = models.TextField(blank=True, null=True)
    sr_comment = models.TextField(blank=True, null=True)
    photos_link = models.TextField(blank=True, null=True)
    photo_date = models.DateTimeField(blank=True, null=True)
    retouch_date = models.DateTimeField(blank=True, null=True)

    def __str__(self):
        return self.RequestNumber

# Модель для категорий товаров
class ProductCategory(models.Model):
    id = models.IntegerField(primary_key=True)
    name = models.CharField(max_length=255, blank=True, null=True)
    reference_link = models.TextField(blank=True, null=True)

    def __str__(self):
        return self.name

# Модель для статусов движения товара
class ProductMoveStatus(models.Model):
    id = models.IntegerField(primary_key=True)
    name = models.CharField(max_length=255, blank=True, null=True)

    def __str__(self):
        return f"{self.id} - {self.name}"

# Модель для товаров
class Product(models.Model):
    barcode = models.CharField(max_length=13, unique=True)
    name = models.CharField(max_length=255)
    cell = models.CharField(max_length=50, blank=True, null=True)
    category = models.ForeignKey(ProductCategory, on_delete=models.SET_NULL, null=True)
    in_stock_sum = models.IntegerField()
    seller = models.IntegerField(null=True, blank=True)
    move_status = models.ForeignKey(ProductMoveStatus, on_delete=models.SET_NULL, null=True, default=7)
    retouch_link = models.TextField(blank=True, null=True)
    income_date = models.DateTimeField(null=True, blank=True)  # Дата приемки
    outcome_date = models.DateTimeField(null=True, blank=True)  # Дата отправки
    income_stockman = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='income_stockman_products')
    outcome_stockman = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='outcome_stockman_products')
    info = models.TextField(blank=True, null=True)
    priority = models.BooleanField(default=False, verbose_name="Priority")

    def __str__(self):
        return f"{self.barcode} - {self.name}"  # Отображаем barcode и имя
    
class STRequestProduct(models.Model):
    request = models.ForeignKey(STRequest, on_delete=models.CASCADE)
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    retouch_status = models.ForeignKey('RetouchStatus', on_delete=models.SET_NULL, blank=True, null=True)
    photo_status = models.ForeignKey('PhotoStatus', on_delete=models.SET_NULL, blank=True, null=True)
    photos_link = models.TextField(blank=True, null=True)
    sphoto_status = models.ForeignKey('SPhotoStatus', on_delete=models.SET_NULL, blank=True, null=True)
    comment = models.TextField(blank=True, null=True)
    OnRetouch = models.BooleanField(default=False, verbose_name="OnRetouch")

    class Meta:
        ordering = ['product__barcode']  # Сортировка по штрихкоду продукта

class Role(models.Model):
    name = models.CharField(max_length=255)

class UserRole(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    role = models.ForeignKey(Role, on_delete=models.CASCADE)

class OrderStatus(models.Model):
    id = models.IntegerField(primary_key=True)  # Allows managing ID
    name = models.CharField(max_length=255)

    def __str__(self):
        return self.name

class Order(models.Model):
    OrderNumber = models.BigIntegerField(unique=True, null=True)
    date = models.DateTimeField(null=True, blank=True)
    creator = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    status = models.ForeignKey(OrderStatus, on_delete=models.SET_NULL, null=True, blank=True)

    assembly_date = models.DateTimeField(null=True, blank=True)  # Дата сборки
    assembly_user = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True, related_name='assembly_user'
    )  # Пользователь, который сделал сборку
    accept_date = models.DateTimeField(null=True, blank=True)  # Дата приемки
    accept_user = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True, related_name='accept_user'
    )  # Пользователь, который принял товар

    def __str__(self):
        return str(self.OrderNumber)

class OrderProduct(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE)
    product = models.ForeignKey('Product', on_delete=models.CASCADE)

    assembled = models.BooleanField(default=False)  # Assembly status
    assembled_date = models.DateTimeField(null=True, blank=True)  # Date and time of assembly

    accepted = models.BooleanField(default=False)  # Acceptance status
    accepted_date = models.DateTimeField(null=True, blank=True)  # Date and time of acceptance

class Invoice(models.Model):
    InvoiceNumber = models.CharField(max_length=13, unique=True, null=True)
    date = models.DateTimeField(null=True, blank=True)
    creator = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)

    def __str__(self):
        return self.InvoiceNumber

class InvoiceProduct(models.Model):
    invoice = models.ForeignKey(Invoice, on_delete=models.CASCADE)
    product = models.ForeignKey(Product, on_delete=models.CASCADE)

class RetouchStatus(models.Model):
    id = models.IntegerField(primary_key=True)
    name = models.CharField(max_length=255, blank=True, null=True)

    def __str__(self):
        return self.name

class SRetouchStatus(models.Model):
    id = models.IntegerField(primary_key=True)
    name = models.CharField(max_length=255, blank=True, null=True)

    def __str__(self):
        return self.name

class PhotoStatus(models.Model):
    id = models.IntegerField(primary_key=True)
    name = models.CharField(max_length=255, blank=True, null=True)

    def __str__(self):
        return self.name

class SPhotoStatus(models.Model):
    id = models.IntegerField(primary_key=True)
    name = models.CharField(max_length=255, blank=True, null=True)

    def __str__(self):
        return self.name

# Типы операций
class ProductOperationTypes(models.Model):
    id = models.IntegerField(primary_key=True)  # ID операций задаете самостоятельно
    name = models.CharField(max_length=255)  # Название операции

    def __str__(self):
        return self.name


# Модель для записи операций
class ProductOperation(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    operation_type = models.ForeignKey(ProductOperationTypes, on_delete=models.SET_NULL, null=True)  # ForeignKey on operation type
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    date = models.DateTimeField(auto_now_add=True)
    comment = models.TextField(blank=True, null=True)  # New comment field
    
    def __str__(self):
        return f"{self.product.barcode} - {self.operation_type.name}"

class UserURLs(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, primary_key=True)  # Внешний ключ и основной ключ
    income_url = models.CharField(max_length=255, blank=True, null=True)  # Поле для входящей ссылки
    outcome_url = models.CharField(max_length=255, blank=True, null=True)  # Поле для исходящей ссылки

    def __str__(self):
        return f"{self.user.username} URLs"

# Типы операций для истории операций с заявками
class STRequestHistoryOperations(models.Model):
    id = models.IntegerField(primary_key=True)
    name = models.CharField(max_length=255)

    def __str__(self):
        return self.name

# История операций с заявками
class STRequestHistory(models.Model):
    st_request = models.ForeignKey('STRequest', on_delete=models.CASCADE, related_name='history')  # ForeignKey на заявку
    product = models.ForeignKey('Product', on_delete=models.CASCADE, related_name='request_history', blank=True, null=True)  # ForeignKey на продукт
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='request_operations')  # ForeignKey на пользователя
    date = models.DateTimeField(auto_now_add=True)  # Штамп даты и времени
    operation = models.ForeignKey(STRequestHistoryOperations, on_delete=models.SET_NULL, null=True, related_name='request_histories')  # ForeignKey на тип операции

    class Meta:
        ordering = ['-date']  # Сортировка по дате (новейшие записи первыми)

    def __str__(self):
        return f"Request: {self.st_request.RequestNumber}, Product: {self.product.barcode}, Operation: {self.operation.name}"

# Типы операций для истории операций с заявками
class Camera(models.Model):
    id = models.IntegerField(primary_key=True)
    IP = models.CharField(max_length=50)

    def __str__(self):
        return f"Camera {self.id} - {self.IP}"

class RetouchRequestStatus(models.Model):
    id = models.IntegerField(primary_key=True)
    name = models.CharField(max_length=255)

    def __str__(self):
        return self.name

class RetouchRequest(models.Model):
    RequestNumber = models.BigIntegerField(unique=True)
    retoucher = models.ForeignKey(User, on_delete=models.SET_NULL, related_name='retouch_requests', blank=True, null=True)
    creation_date = models.DateTimeField(auto_now_add=True)
    retouch_date = models.DateTimeField(blank=True, null=True)
    status = models.ForeignKey(RetouchRequestStatus, on_delete=models.SET_NULL, null=True)
    comments = models.TextField(blank=True, null=True)
    priority = models.SmallIntegerField(default=3)

    def __str__(self):
        return str(self.RequestNumber)

class ShootingToRetouchLink(models.Model):
    shooting_request = models.ForeignKey(STRequest, on_delete=models.CASCADE, related_name='linked_to_retouch')
    retouch_request = models.ForeignKey(RetouchRequest, on_delete=models.CASCADE, related_name='linked_to_shooting')

    def __str__(self):
        return f"Shooting: {self.shooting_request.RequestNumber} -> Retouch: {self.retouch_request.RequestNumber}"

class RetouchRequestProduct(models.Model):
    retouch_request = models.ForeignKey(RetouchRequest, on_delete=models.CASCADE, related_name='request')
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    retouch_status = models.ForeignKey(RetouchStatus, on_delete=models.SET_NULL, blank=True, null=True)
    retouch_link = models.TextField(blank=True, null=True)  # Ссылка на обработанный файл
    sretouch_status = models.ForeignKey(SRetouchStatus, on_delete=models.SET_NULL, blank=True, null=True)
    comment = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"{self.product.barcode} in Retouch Request {self.retouch_request.RequestNumber}"
