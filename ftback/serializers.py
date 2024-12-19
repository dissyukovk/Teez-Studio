from rest_framework import serializers
from django.contrib.auth.models import User
from core.models import(
    UserProfile,
    Product,
    STRequest,
    STRequestProduct,
    STRequestStatus,
    Product,
    PhotoStatus,
    SPhotoStatus,
    ProductCategory,
    Camera,
    
)

class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = '__all__'

class ProductSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = '__all__'

class STRequestSerializer(serializers.ModelSerializer):
    class Meta:
        model = STRequest
        fields = '__all__'

class STRequestPhotographerListSerializer(serializers.ModelSerializer):
    total_products = serializers.SerializerMethodField()
    shooted_count = serializers.SerializerMethodField()
    correct_count = serializers.SerializerMethodField()
    incorrect_count = serializers.SerializerMethodField()
    priority_count = serializers.SerializerMethodField()  # Новый метод

    class Meta:
        model = STRequest
        fields = [
            "RequestNumber",
            "photo_date",
            "total_products",
            "shooted_count",
            "correct_count",
            "incorrect_count",
            "priority_count"
        ]

    def get_total_products(self, obj):
        return obj.strequestproduct_set.count()

    def get_shooted_count(self, obj):
        return obj.strequestproduct_set.filter(photo_status__isnull=False).count()

    def get_correct_count(self, obj):
        return obj.strequestproduct_set.filter(sphoto_status_id=2).count()

    def get_incorrect_count(self, obj):
        return obj.strequestproduct_set.filter(sphoto_status_id=1).count()

    def get_priority_count(self, obj):
        return obj.strequestproduct_set.filter(product__priority=True).count()

class PhotographerSTRequestSerializer(serializers.ModelSerializer):
    products = serializers.SerializerMethodField()
    status = serializers.CharField(source="status.name", read_only=True)
    total_products = serializers.SerializerMethodField()  # Нужно добавить, если еще не было
    priority_count = serializers.SerializerMethodField()  # Новый метод

    class Meta:
        model = STRequest
        fields = [
            'RequestNumber',
            'products',
            'status',
            'total_products',
            'priority_count',
            'photo_date'
        ]

    def get_products(self, obj):
        request_products = STRequestProduct.objects.filter(request=obj).select_related(
            'product', 'product__category', 'photo_status', 'sphoto_status'
        )

        products_data = []
        for rp in request_products:
            product = rp.product
            products_data.append({
                'barcode': product.barcode,
                'name': product.name,
                'category': product.category.name if product.category else None,
                'reference_link': product.category.reference_link if product.category else None,
                'photo_status': rp.photo_status.name if rp.photo_status else None,
                'sphoto_status': rp.sphoto_status.name if rp.sphoto_status else None,
            })
        return products_data

    def get_total_products(self, obj):
        return obj.strequestproduct_set.count()

    def get_priority_count(self, obj):
        return obj.strequestproduct_set.filter(product__priority=True).count()

class CameraSerializer(serializers.ModelSerializer):
    class Meta:
        model = Camera
        fields = ['id', 'IP']

class PhotographerProductSerializer(serializers.ModelSerializer):
    category = serializers.CharField(source="category.name", allow_null=True)
    reference_link = serializers.CharField(source="category.reference_link", allow_null=True)
    comment = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = ["barcode", "name", "category", "reference_link", "comment", "info", "priority"]

    def get_comment(self, obj):
        """Получаем комментарий из модели STRequestProduct."""
        request_number = self.context.get("request_number")
        if request_number:
            try:
                # Найти STRequest по номеру
                st_request = STRequest.objects.get(RequestNumber=request_number)
                # Найти STRequestProduct по продукту и STRequest
                st_request_product = STRequestProduct.objects.get(product=obj, request=st_request)
                return st_request_product.comment  # Используем поле comment
            except (STRequest.DoesNotExist, STRequestProduct.DoesNotExist):
                return None
        return None

class SPhotographerRequestListSerializer(serializers.ModelSerializer):
    status_name = serializers.CharField(source='status.name', read_only=True)
    stockman_name = serializers.SerializerMethodField()
    photographer_name = serializers.SerializerMethodField()
    total_products = serializers.SerializerMethodField()
    taken_count = serializers.SerializerMethodField()
    unchecked_count = serializers.SerializerMethodField()
    priority_count = serializers.SerializerMethodField()

    class Meta:
        model = STRequest
        fields = [
            'RequestNumber',
            'status_name',
            'stockman_name',
            'photographer_name',
            'total_products',
            'taken_count',
            'unchecked_count',
            'priority_count',
            'creation_date',
            'photo_date'
        ]

    def get_stockman_name(self, obj):
        if obj.stockman:
            return f"{obj.stockman.first_name} {obj.stockman.last_name}"
        return ""

    def get_photographer_name(self, obj):
        if obj.photographer:
            return f"{obj.photographer.first_name} {obj.photographer.last_name}"
        return ""

    def get_total_products(self, obj):
        return obj.strequestproduct_set.count()

    def get_taken_count(self, obj):
        return obj.strequestproduct_set.filter(photo_status_id__in=[1,2,25]).count()

    def get_unchecked_count(self, obj):
        return obj.strequestproduct_set.filter(photo_status_id__in=[1,2,25]).exclude(sphoto_status_id=1).count()

    def get_priority_count(self, obj):
        return obj.strequestproduct_set.filter(product__priority=True).count()

class PhotoStatusSerializer(serializers.ModelSerializer):
    class Meta:
        model = PhotoStatus
        fields = ['id', 'name']


class SPhotoStatusSerializer(serializers.ModelSerializer):
    class Meta:
        model = SPhotoStatus
        fields = ['id', 'name']


class SPhotographerRequestProductDetailSerializer(serializers.ModelSerializer):
    barcode = serializers.CharField(source='product.barcode', read_only=True)
    product_name = serializers.CharField(source='product.name', read_only=True)
    category_name = serializers.CharField(source='product.category.name', read_only=True)
    reference_link = serializers.CharField(source='product.category.reference_link', read_only=True)
    photo_status_name = serializers.CharField(source='photo_status.name', read_only=True)
    sphoto_status_name = serializers.CharField(source='sphoto_status.name', read_only=True)
    info = serializers.CharField(source='product.info', read_only=True)  # Из product
    priority = serializers.BooleanField(source='product.priority', read_only=True)  # Из product

    class Meta:
        model = STRequestProduct
        fields = [
            'barcode',
            'product_name',
            'category_name',
            'reference_link',
            'photo_status_name',
            'sphoto_status_name',
            'sphoto_status_id',
            'photos_link',
            'comment',
            'info',      # теперь берется из product.info
            'priority'   # теперь берется из product.priority
        ]

class SPhotographerRequestDetailSerializer(serializers.ModelSerializer):
    status_name = serializers.CharField(source='status.name', read_only=True)
    stockman_name = serializers.SerializerMethodField()
    photographer_name = serializers.SerializerMethodField()
    total_products = serializers.SerializerMethodField()
    taken_count = serializers.SerializerMethodField()
    unchecked_count = serializers.SerializerMethodField()
    priority_count = serializers.SerializerMethodField()  # Новый метод
    products = SPhotographerRequestProductDetailSerializer(source='strequestproduct_set', many=True)

    class Meta:
        model = STRequest
        fields = [
            'RequestNumber',
            'status_name',
            'stockman_name',
            'photographer_name',
            'total_products',
            'taken_count',
            'unchecked_count',
            'priority_count',  # Добавляем в поля
            'creation_date',
            'photo_date',
            'products'
        ]

    def get_stockman_name(self, obj):
        if obj.stockman:
            return f"{obj.stockman.first_name} {obj.stockman.last_name}"
        return ""

    def get_photographer_name(self, obj):
        if obj.photographer:
            return f"{obj.photographer.first_name} {obj.photographer.last_name}"
        return ""

    def get_total_products(self, obj):
        return obj.strequestproduct_set.count()

    def get_taken_count(self, obj):
        return obj.strequestproduct_set.filter(photo_status_id__in=[1,2,25]).count()

    def get_unchecked_count(self, obj):
        return obj.strequestproduct_set.filter(photo_status_id__in=[1,2,25]).exclude(sphoto_status_id=1).count()

    def get_priority_count(self, obj):
        return obj.strequestproduct_set.filter(product__priority=True).count()

class PhotographerUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'first_name', 'last_name']
