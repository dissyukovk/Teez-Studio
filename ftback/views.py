from django.shortcuts import render
from django.contrib.auth.models import Group, User
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Count, Q
from django.utils import timezone
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.filters import SearchFilter, OrderingFilter
from rest_framework import generics, status
from .pagination import StandardResultsSetPagination
from core.models import (
    UserProfile,
    Product,
    STRequest,
    STRequestStatus,
    STRequestProduct,
    Product,
    PhotoStatus,
    SPhotoStatus,
    UserProfile,
    Camera,
    STRequestProduct,
    PhotoStatus,
)
from .serializers import (
    UserProfileSerializer,
    ProductSerializer,
    STRequestSerializer,
    STRequestPhotographerListSerializer,
    PhotographerSTRequestSerializer,
    CameraSerializer,
    PhotographerProductSerializer,
    SPhotographerRequestListSerializer,
    SPhotographerRequestDetailSerializer,
    PhotoStatusSerializer,
    SPhotoStatusSerializer,
    PhotographerUserSerializer
)

# CRUD для UserProfile
class UserProfileListCreateView(generics.ListCreateAPIView):
    queryset = UserProfile.objects.all()
    serializer_class = UserProfileSerializer
    permission_classes = [IsAuthenticated]

class UserProfileDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = UserProfile.objects.all()
    serializer_class = UserProfileSerializer
    permission_classes = [IsAuthenticated]

# CRUD для Product
class ProductListCreateView(generics.ListCreateAPIView):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    permission_classes = [IsAuthenticated]

class ProductDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    permission_classes = [IsAuthenticated]

# CRUD для STRequest
class STRequestListCreateView(generics.ListCreateAPIView):
    queryset = STRequest.objects.all()
    serializer_class = STRequestSerializer
    permission_classes = [IsAuthenticated]

class STRequestDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = STRequest.objects.all()
    serializer_class = STRequestSerializer
    permission_classes = [IsAuthenticated]

class UserInfoView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        print("Получение информации о пользователе")
        print(f"Пользователь: {request.user}")

        try:
            # Доступ к профилю пользователя
            profile = request.user.profile  # Связанное поле OneToOneField
            print(f"Профиль пользователя найден: {profile}")
            on_work = profile.on_work
        except UserProfile.DoesNotExist:
            print("Профиль пользователя не найден")
            on_work = None

        # Получение групп пользователя
        groups = request.user.groups.values_list('name', flat=True)
        print(f"Группы пользователя: {list(groups)}")

        return Response({
            "id": request.user.id,
            "first_name": request.user.first_name,
            "last_name": request.user.last_name,
            "on_work": on_work,
            "groups": list(groups),  # Добавляем список групп
        })


class UpdateOnWorkView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request):
        print("Метод patch вызван")
        print(f"Пользователь: {request.user}")  # Проверка текущего пользователя
        print(f"Тело запроса: {request.data}")  # Проверка тела запроса

        try:
            profile = UserProfile.objects.get(user=request.user)
            print(f"Профиль найден: {profile}")
            
            on_work = request.data.get('on_work', None)
            if on_work is not None:
                profile.on_work = bool(on_work)
                profile.save()

                return Response({
                    "message": "Статус обновлен",
                    "on_work": profile.on_work
                }, status=status.HTTP_200_OK)

            return Response({
                "error": "Не передан статус"
            }, status=status.HTTP_400_BAD_REQUEST)

        except UserProfile.DoesNotExist:
            print("Профиль пользователя не найден")
            return Response({
                "error": "Пользователь не найден"
            }, status=status.HTTP_404_NOT_FOUND)

class PhotographerSTRequestListView(generics.ListAPIView):
    serializer_class = STRequestPhotographerListSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        # Фильтруем заявки для текущего пользователя, у которых статус равен 3
        return STRequest.objects.filter(photographer=user, status_id=3)

class PhotographerSTRequestDetailView(APIView):
    """
    Возвращает детали одной заявки для фотографа.
    """
    def get(self, request, request_number):
        try:
            # Ищем заявку по номеру
            st_request = STRequest.objects.get(RequestNumber=request_number)

            # Сериализуем данные заявки
            serializer = PhotographerSTRequestSerializer(st_request)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except STRequest.DoesNotExist:
            return Response({"error": "Заявка не найдена"}, status=status.HTTP_404_NOT_FOUND)

class CameraListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        cameras = Camera.objects.all()
        serializer = CameraSerializer(cameras, many=True)
        return Response(serializer.data)

class PhotographerProductView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, barcode):
        try:
            # Получаем продукт по штрихкоду
            product = Product.objects.get(barcode=barcode)

            # Получаем номер заявки из параметров запроса
            request_number = request.query_params.get("request_number")
            if not request_number:
                return Response(
                    {"error": "Не указан номер заявки"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # Сериализуем данные, передавая context с request_number
            serializer = PhotographerProductSerializer(product, context={"request_number": request_number})
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Product.DoesNotExist:
            # Если продукт не найден
            return Response(
                {"error": "Продукт с таким штрихкодом не найден"},
                status=status.HTTP_404_NOT_FOUND,
            )

class PhotographerUpdateProductView(APIView):
    def post(self, request):
        request_number = request.data.get('STRequestNumber')
        barcode = request.data.get('barcode')
        photo_status_id = request.data.get('photo_status')
        photos_link = request.data.get('photos_link')

        # Проверяем, что необходимые поля переданы
        if not request_number or not barcode:
            return Response({"error": "STRequestNumber и barcode являются обязательными полями."}, 
                            status=status.HTTP_400_BAD_REQUEST)

        # Находим заявку
        try:
            st_request = STRequest.objects.get(RequestNumber=request_number)
        except STRequest.DoesNotExist:
            return Response({"error": "Заявка с таким номером не найдена."}, 
                            status=status.HTTP_404_NOT_FOUND)

        # Находим продукт
        try:
            product = Product.objects.get(barcode=barcode)
        except Product.DoesNotExist:
            return Response({"error": "Продукт с таким штрихкодом не найден."}, 
                            status=status.HTTP_404_NOT_FOUND)

        # Находим связку STRequestProduct
        try:
            st_request_product = STRequestProduct.objects.get(request=st_request, product=product)
        except STRequestProduct.DoesNotExist:
            return Response({"error": "Связка STRequestProduct не найдена."}, 
                            status=status.HTTP_404_NOT_FOUND)

        # Проверяем, указан ли photo_status, и валиден ли он
        if photo_status_id is not None:
            try:
                photo_status = PhotoStatus.objects.get(id=photo_status_id)
            except PhotoStatus.DoesNotExist:
                return Response({"error": "Указанный photo_status не найден."}, 
                                status=status.HTTP_404_NOT_FOUND)
            st_request_product.photo_status = photo_status

        # Обновляем photos_link, если оно передано
        if photos_link is not None:
            st_request_product.photos_link = photos_link

        # Сохраняем изменения
        st_request_product.save()

        return Response({"message": "STRequestProduct успешно обновлён."}, status=status.HTTP_200_OK)

class SPhotographerRequestsListView(generics.ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = SPhotographerRequestListSerializer
    pagination_class = StandardResultsSetPagination

    # Фильтры и сортировка
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    search_fields = ['RequestNumber', 'strequestproduct__product__barcode']

    # Добавляем priority_count в список возможных полей для сортировки
    ordering_fields = [
        'RequestNumber', 
        'creation_date', 
        'photographer__last_name', 
        'photographer__first_name', 
        'priority_count'  # Добавляем сюда
    ]

    # Дефолтная сортировка: сначала по убыванию количества приоритетных товаров, потом по дате
    ordering = ['-priority_count', 'creation_date']

    def get_queryset(self):
        queryset = STRequest.objects.all()

        # Аннотируем количество приоритетных продуктов
        queryset = queryset.annotate(
            priority_count=Count(
                'strequestproduct',
                filter=Q(strequestproduct__product__priority=True)
            )
        )

        status_id = self.request.query_params.get('status_id', None)
        if status_id:
            queryset = queryset.filter(status_id=status_id)

        return queryset

class PhotoStatusListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        qs = PhotoStatus.objects.all()
        serializer = PhotoStatusSerializer(qs, many=True)
        return Response(serializer.data)


class SPhotoStatusListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        qs = SPhotoStatus.objects.all()
        serializer = SPhotoStatusSerializer(qs, many=True)
        return Response(serializer.data)

class SPhotographerRequestDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        request_number = request.query_params.get('request_number', None)
        if not request_number:
            return Response({"error": "request_number is required"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            st_request = STRequest.objects.get(RequestNumber=request_number)
        except STRequest.DoesNotExist:
            return Response({"error": "STRequest not found"}, status=status.HTTP_404_NOT_FOUND)

        serializer = SPhotographerRequestDetailSerializer(st_request)
        return Response(serializer.data)

class OnWorkPhotographersListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            group = Group.objects.get(name="Фотограф")
        except Group.DoesNotExist:
            return Response([], status=status.HTTP_200_OK)
        users = User.objects.filter(groups=group, profile__on_work=True)
        serializer = PhotographerUserSerializer(users, many=True)
        return Response(serializer.data)


class UpdateSPhotoStatusView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        request_number = request.data.get('request_number')
        barcode = request.data.get('barcode')
        sphoto_status_id = request.data.get('sphoto_status_id')
        comment = request.data.get('comment', None)

        if not (request_number and barcode and sphoto_status_id):
            return Response({"error": "request_number, barcode and sphoto_status_id are required"},
                            status=status.HTTP_400_BAD_REQUEST)

        try:
            st_request = STRequest.objects.get(RequestNumber=request_number)
        except STRequest.DoesNotExist:
            return Response({"error": "STRequest not found"}, status=status.HTTP_404_NOT_FOUND)

        try:
            product = Product.objects.get(barcode=barcode)
        except Product.DoesNotExist:
            return Response({"error": "Product not found"}, status=status.HTTP_404_NOT_FOUND)

        try:
            srp = STRequestProduct.objects.get(request=st_request, product=product)
        except STRequestProduct.DoesNotExist:
            return Response({"error": "STRequestProduct not found"}, status=status.HTTP_404_NOT_FOUND)

        try:
            new_status = SPhotoStatus.objects.get(id=sphoto_status_id)
        except SPhotoStatus.DoesNotExist:
            return Response({"error": "SPhotoStatus not found"}, status=status.HTTP_404_NOT_FOUND)

        srp.sphoto_status = new_status

        # Если выбран "правки" (id=2), то устанавливаем photo_status в 10
        if sphoto_status_id == 2:
            try:
                new_photo_status = PhotoStatus.objects.get(id=10)
                srp.photo_status = new_photo_status
            except PhotoStatus.DoesNotExist:
                pass

        if comment is not None and comment.strip():
            srp.comment = comment.strip()

        srp.save()

        # Если sphoto_status = 1, проверяем все товары
        # Если sphoto_status = 1, проверяем все товары заявки на предмет sphoto_status
        if sphoto_status_id == 1:
            all_products = st_request.strequestproduct_set.all()
            # Проверяем, что нет ни одного товара у которого sphoto_status_id не равен 1 (или null)
            # Если мы хотим учесть и нулевые (null) значения, то для них sphoto_status_id будет None.
            # Если условие: "не должно оставаться нулей" - значит ни один товар не должен иметь sphoto_status_id=None
            # Тогда можно проверить, что нет товаров со статусом отличным от 1 и что sphoto_status_id у всех не null.

            if all_products.exists() \
               and all_products.exclude(sphoto_status_id=1).count() == 0 \
               and all_products.filter(sphoto_status_id__isnull=True).count() == 0:
                # Значит все товары имеют sphoto_status_id=1, ни у кого нет null, и нет других значений
                try:
                    new_request_status = STRequestStatus.objects.get(id=5)
                    st_request.status = new_request_status
                    st_request.save()
                except STRequestStatus.DoesNotExist:
                    pass

        return Response({"message": "SPhotoStatus updated successfully"}, status=status.HTTP_200_OK)

class AssignRequestToPhotographerView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        request_number = request.data.get('request_number')
        user_id = request.data.get('user_id')

        if not (request_number and user_id):
            return Response({"error": "request_number and user_id are required"},
                            status=status.HTTP_400_BAD_REQUEST)

        try:
            st_request = STRequest.objects.get(RequestNumber=request_number)
        except STRequest.DoesNotExist:
            return Response({"error": "STRequest not found"}, status=status.HTTP_404_NOT_FOUND)

        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)

        st_request.photographer = user
        # Меняем статус заявки на 3
        try:
            new_status = STRequestStatus.objects.get(id=3)
            st_request.status = new_status
        except STRequestStatus.DoesNotExist:
            # Если статус не найден, можно либо вернуть ошибку, либо оставить без изменения
            pass

        # Устанавливаем текущее время и дату в photo_date
        st_request.photo_date = timezone.now()
        st_request.save()

        return Response({"message": "STRequest assigned to photographer successfully"}, status=status.HTTP_200_OK)
