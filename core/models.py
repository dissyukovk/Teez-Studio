from django.db import models
from django.contrib.auth.models import User

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

    def __str__(self):
        return f"{self.barcode} - {self.name}"  # Отображаем barcode и имя
    
class STRequestProduct(models.Model):
    request = models.ForeignKey(STRequest, on_delete=models.CASCADE)
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    retouch_status = models.ForeignKey('RetouchStatus', on_delete=models.SET_NULL, blank=True, null=True)

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
    OrderNumber = models.CharField(max_length=13, unique=True, null=True)
    date = models.DateTimeField(null=True, blank=True)
    creator = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)  # Reference to the user
    status = models.ForeignKey(OrderStatus, on_delete=models.SET_NULL, null=True, blank=True)  # Reference to OrderStatus

    def __str__(self):
        return self.OrderNumber

class OrderProduct(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE)
    product = models.ForeignKey(Product, on_delete=models.CASCADE)

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
