from rest_framework import serializers
from django.contrib.auth.models import User
from django.db.models import Count
from .models import Product, STRequestProduct, STRequest, Invoice, InvoiceProduct, ProductMoveStatus, ProductOperation, Order, OrderStatus, OrderProduct, ProductCategory, RetouchStatus, STRequestStatus, ProductOperationTypes

class UserSerializer(serializers.ModelSerializer):
    groups = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'first_name', 'last_name', 'email', 'groups']

    def get_groups(self, obj):
        return [group.name for group in obj.groups.all()]

class ProductSerializer(serializers.ModelSerializer):
    move_status_id = serializers.IntegerField(source='move_status.id', allow_null=True, default=None)
    move_status = serializers.CharField(source='move_status.name', default='N/A')
    request_number = serializers.SerializerMethodField()
    invoice_number = serializers.SerializerMethodField()
    income_stockman = serializers.SerializerMethodField()
    outcome_stockman = serializers.SerializerMethodField()
    photographer = serializers.SerializerMethodField()
    retoucher = serializers.SerializerMethodField()
    request_status = serializers.SerializerMethodField()
    photos_link = serializers.SerializerMethodField()
    category_name = serializers.CharField(source='category.name', default='N/A')  # Прямой доступ через связь
    category_id = serializers.IntegerField(source='category.id', default='N/A')  # Прямой доступ через связь
    category_reference_link = serializers.CharField(source='category.reference_link', default='N/A')  # Ссылка категории
    
    def get_request_number(self, obj):
        # Use preloaded related data
        request_product = obj.strequestproduct_set.first()
        if request_product and request_product.request:
            return request_product.request.RequestNumber
        return 'N/A'

    def get_invoice_number(self, obj):
        # Use preloaded related data
        invoice_product = obj.invoiceproduct_set.first()
        if invoice_product and invoice_product.invoice:
            return invoice_product.invoice.InvoiceNumber
        return 'N/A'

    def get_income_stockman(self, obj):
        if obj.income_stockman:
            return f"{obj.income_stockman.first_name} {obj.income_stockman.last_name}"
        return 'N/A'

    def get_outcome_stockman(self, obj):
        if obj.outcome_stockman:
            return f"{obj.outcome_stockman.first_name} {obj.outcome_stockman.last_name}"
        return 'N/A'

    def get_photographer(self, obj):
        request_product = obj.strequestproduct_set.first()  # Правильное использование related manager
        if request_product and request_product.request and request_product.request.photographer:
            return f"{request_product.request.photographer.first_name} {request_product.request.photographer.last_name}"
        return 'N/A'

    def get_retoucher(self, obj):
        request_product = obj.strequestproduct_set.first()  # Правильное использование related manager
        if request_product and request_product.request and request_product.request.retoucher:
            return f"{request_product.request.retoucher.first_name} {request_product.request.retoucher.last_name}"
        return 'N/A'

    def get_request_status(self, obj):
        request_product = obj.strequestproduct_set.first()  # Правильное использование related manager
        if request_product and request_product.request and request_product.request.status:
            return request_product.request.status.name
        return 'N/A'

    def get_photos_link(self, obj):
        request_product = obj.strequestproduct_set.first()  # Правильное использование related manager
        if request_product and request_product.request and request_product.request.photos_link:
            return request_product.request.photos_link
        return 'N/A'

    class Meta:
        model = Product
        fields = ['barcode', 'name', 'category_id', 'category_name', 'category_reference_link', 'seller', 'income_date', 'outcome_date', 
                  'income_stockman', 'outcome_stockman', 'in_stock_sum', 'cell', 'request_number', 
                  'invoice_number', 'move_status_id', 'move_status', 'photographer', 'retoucher', 'request_status', 
                  'photos_link', 'retouch_link']

class STRequestStatusSerializer(serializers.ModelSerializer):
    class Meta:
        model = STRequestStatus
        fields = ['id', 'name']  # Включаем id и название статуса

class STRequestSerializer(serializers.ModelSerializer):
    total_products = serializers.SerializerMethodField()
    photographer_first_name = serializers.CharField(source="photographer.first_name", default="Не назначен")
    photographer_last_name = serializers.CharField(source="photographer.last_name", default="")
    retoucher_first_name = serializers.CharField(source="retoucher.first_name", default="Не назначен")
    retoucher_last_name = serializers.CharField(source="retoucher.last_name", default="")
    sr_comment = serializers.CharField(allow_blank=True, required=False)
    stockman = UserSerializer()
    status = STRequestStatusSerializer()

    class Meta:
        model = STRequest
        fields = [
            'RequestNumber',
            'creation_date',
            'photographer',
            'retoucher',
            'stockman',
            'status',
            'total_products',
            'photographer_first_name',
            'photographer_last_name',
            'retoucher_first_name',
            'retoucher_last_name',
            'stockman',
            'sr_comment',
            's_ph_comment',
            'photo_date',
            'retouch_date'
        ]

    def get_total_products(self, obj):
        # Используем автоматически сгенерированный related_name 'strequestproduct_set'
        return obj.strequestproduct_set.count()

class InvoiceSerializer(serializers.ModelSerializer):
    total_products = serializers.SerializerMethodField()  # Поле для подсчета товаров
    date = serializers.DateTimeField(format="%Y-%m-%d %H:%M:%S")  # Форматируем дату

    def get_total_products(self, obj):
        # Подсчитываем количество товаров в накладной
        return obj.invoiceproduct_set.count()

    # Добавляем поле для отображения имени создателя
    creator = serializers.CharField(source='creator.username', default=None, allow_null=True)

    class Meta:
        model = Invoice
        fields = ['InvoiceNumber', 'date', 'creator', 'total_products']
        
class StatusSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductMoveStatus
        fields = ['id', 'name']

class ProductOperationSerializer(serializers.ModelSerializer):
    operation_type_name = serializers.CharField(source='operation_type.name', read_only=True)
    user_full_name = serializers.SerializerMethodField()

    class Meta:
        model = ProductOperation
        fields = ['operation_type_name', 'user_full_name', 'date', 'comment']

    def get_user_full_name(self, obj):
        return f"{obj.user.first_name} {obj.user.last_name}" if obj.user else "Unknown"


class OrderStatusSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderStatus
        fields = ['id', 'name']  # Укажите необходимые поля

class OrderSerializer(serializers.ModelSerializer):
    creator = UserSerializer()  # Включаем полный сериализатор для пользователя
    status = OrderStatusSerializer()  # Включаем полный сериализатор для статуса заказа
    total_products = serializers.SerializerMethodField()

    class Meta:
        model = Order
        fields = ['OrderNumber', 'date', 'status', 'creator', 'total_products']

    def get_total_products(self, obj):
        return OrderProduct.objects.filter(order=obj).count()

class RetouchStatusSerializer(serializers.ModelSerializer):
    class Meta:
        model = RetouchStatus
        fields = ['id', 'name']

class ProductCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductCategory
        fields = ['id', 'name', 'reference_link']
