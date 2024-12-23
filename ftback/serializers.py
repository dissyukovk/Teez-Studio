from rest_framework import serializers
from django.db.models import Max, Sum, Q
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
    RetouchRequest,
    RetouchRequestProduct,
    RetouchRequestStatus,
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

# Сериалайзер (PhotographerSTRequestSerializer)
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
                'info': product.info,
                'priority': product.priority,
                'comment': rp.comment  # Добавили комментарий из STRequestProduct
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
    photo_status_id = serializers.CharField(source='photo_status.id', read_only=True)
    sphoto_status_name = serializers.CharField(source='sphoto_status.name', read_only=True)
    sphoto_status_id = serializers.CharField(source='sphoto_status.id', read_only=True)
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
            'photo_status_id',
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

class SRReadyProductSerializer(serializers.ModelSerializer):
    barcode = serializers.CharField(source='product.barcode', read_only=True)
    name = serializers.CharField(source='product.name', read_only=True)
    category = serializers.CharField(source='product.category.name', read_only=True)
    reference_link = serializers.CharField(source='product.category.reference_link', read_only=True)
    priority = serializers.BooleanField(source='product.priority', read_only=True)
    info = serializers.CharField(source='product.info', read_only=True)
    photo_date = serializers.DateTimeField(source='request.photo_date', read_only=True)
    photos_link = serializers.CharField(read_only=True)

    class Meta:
        model = STRequestProduct
        fields = [
            'id', 'barcode', 'name', 'category', 'reference_link', 'priority', 'info',
            'photo_date', 'OnRetouch', 'photos_link'
        ]

class SRRetouchRequestCreateSerializer(serializers.Serializer):
    strequestproduct_ids = serializers.ListField(
        child=serializers.IntegerField(), allow_empty=False
    )
    retoucher_id = serializers.IntegerField(required=False)

    def create(self, validated_data):
        from django.utils import timezone
        from django.db import transaction
        from django.contrib.auth.models import User

        strequestproduct_ids = validated_data.get('strequestproduct_ids')
        retoucher_id = validated_data.get('retoucher_id', None)

        max_number = RetouchRequest.objects.aggregate(mn=Max('RequestNumber'))['mn'] or 0
        request_number = max_number + 1

        retoucher = None
        if retoucher_id:
            try:
                retoucher = User.objects.get(id=retoucher_id)
            except User.DoesNotExist:
                retoucher = None

        # Определяем статус: если есть назначенный ретушер, статус=2, иначе=1
        status_id = 2 if retoucher else 1

        with transaction.atomic():
            rr = RetouchRequest.objects.create(
                RequestNumber=request_number,
                retoucher=retoucher,
                creation_date=timezone.now(),
                status_id=status_id
            )

            st_products = STRequestProduct.objects.filter(
                id__in=strequestproduct_ids,
                photo_status=1,
                sphoto_status=1
            )
            for sp in st_products:
                RetouchRequestProduct.objects.create(
                    retouch_request=rr,
                    st_request_product=sp,
                )
                sp.OnRetouch = True
                sp.save(update_fields=['OnRetouch'])

        return rr

class SRRetouchersSerializer(serializers.Serializer):
    id = serializers.IntegerField(source='user.id')
    first_name = serializers.CharField(source='user.first_name')
    last_name = serializers.CharField(source='user.last_name')


class SRRetouchRequestSerializer(serializers.ModelSerializer):
    # Если хотите вернуть созданную заявку
    class Meta:
        model = RetouchRequest
        fields = ['RequestNumber', 'creation_date', 'retoucher', 'status', 'comments', 'priority']

class RetouchRequestListSerializer(serializers.ModelSerializer):
    # retoucher_name: имя и фамилия ретушера
    retoucher_name = serializers.SerializerMethodField()
    priority_count = serializers.SerializerMethodField()

    class Meta:
        model = RetouchRequest
        fields = [
            'RequestNumber',
            'creation_date',
            'retoucher_name',
            'comments',
            'priority_count',
            'status',  # ID статуса или вы можете вывести status.name отдельным полем
        ]

    def get_retoucher_name(self, obj):
        if obj.retoucher:
            return f"{obj.retoucher.first_name} {obj.retoucher.last_name}"
        return ""

    def get_priority_count(self, obj):
        """
        Нужно посчитать количество продуктов, у которых product.priority = True
        Здесь логика такая:
        - Ищем все RetouchRequestProduct для данной заявки
        - Через st_request_product получаем product
        - Считаем, у скольких из этих product стоит priority = True
        """
        return RetouchRequestProduct.objects.filter(
            retouch_request=obj,
            st_request_product__product__priority=True
        ).count()


### Сериализатор детальной заявки
class RetouchRequestDetailSerializer(serializers.ModelSerializer):
    # Поля
    retoucher_name = serializers.SerializerMethodField()
    priority_count = serializers.SerializerMethodField()
    # Список товаров
    products = serializers.SerializerMethodField()

    class Meta:
        model = RetouchRequest
        fields = [
            'RequestNumber',
            'creation_date',
            'retoucher_name',
            'comments',
            'priority',
            'status',     # Или status_id / status.name — под вашу логику
            'products',   # Детальный список продуктов
            'retouch_date'
        ]

    def get_retoucher_name(self, obj):
        if obj.retoucher:
            return f"{obj.retoucher.first_name} {obj.retoucher.last_name}"
        return ""

    def get_priority_count(self, obj):
        return RetouchRequestProduct.objects.filter(
            retouch_request=obj,
            st_request_product__product__priority=True
        ).count()

    def get_products(self, obj):
        """
        Возвращаем список товаров, прикреплённых к этой заявке.
        По каждому товару:
        - штрихкод, наименование, категория, reference_link
        - ссылка на исходники (strequestproduct.photos_link)
        - retouch_status, sretouch_status
        - retouch_link
        - comment (RetouchRequestProduct.comment)
        """
        rr_products = RetouchRequestProduct.objects.filter(retouch_request=obj).select_related(
            'st_request_product__product',
            'retouch_status',
            'sretouch_status'
        )

        items = []
        for rrp in rr_products:
            st_rp = rrp.st_request_product
            if not st_rp:
                continue  # Пропускаем, если нет st_request_product
            p = st_rp.product

            items.append({
                'barcode': p.barcode,
                'name': p.name,
                'category': p.category.name if p.category else None,
                'reference_link': p.category.reference_link if p.category else None,
                'photos_link': st_rp.photos_link,  # ссылка на исходники
                'retouch_status': rrp.retouch_status.name if rrp.retouch_status else None,
                'sretouch_status': rrp.sretouch_status.name if rrp.sretouch_status else None,
                'comment': rrp.comment,
                'retouch_link': rrp.retouch_link,
            })
        return items

class RetouchRequestAssignSerializer(serializers.Serializer):
    request_number = serializers.IntegerField()
    user_id = serializers.IntegerField()

    def validate(self, attrs):
        request_number = attrs.get('request_number')
        user_id = attrs.get('user_id')

        # Проверяем, что заявка с таким номером существует
        try:
            retouch_request = RetouchRequest.objects.get(RequestNumber=request_number)
        except RetouchRequest.DoesNotExist:
            raise serializers.ValidationError({"request_number": "Retouch request not found."})

        # Проверяем, что пользователь с таким id существует
        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            raise serializers.ValidationError({"user_id": "User not found."})

        attrs['retouch_request'] = retouch_request
        attrs['retoucher'] = user
        return attrs

    def create(self, validated_data):
        """
        Здесь используется метод create, если мы делаем POST → .save()
        Обновляем заявку, ставим retoucher, возможно меняем статус.
        """
        retouch_request = validated_data['retouch_request']
        user = validated_data['retoucher']

        # Назначаем
        retouch_request.retoucher = user

        # Если хотите менять статус на 2 (например, "Назначено"), раскомментируйте
        # retouch_request.status_id = 2

        retouch_request.save(update_fields=['retoucher', 'status'])
        return retouch_request
