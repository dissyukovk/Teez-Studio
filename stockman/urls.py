from django.urls import path
from . import views

urlpatterns = [
    path('orders/', views.OrderListView.as_view(), name='order-list'),
    path('order-statuses/', views.OrderStatusListView.as_view(), name='order-status-list'),
    path('order-detail/<int:order_number>/', views.OrderDetailAPIView.as_view(), name='order-detail'),
    path('OrderAcceptStart/<int:ordernumber>/', views.order_accept_start, name='order_accept_start'),
    path('OrderCheckProduct/<int:ordernumber>/<str:barcode>/', views.order_check_product, name='order_check_product'),
    path('OrderAcceptProduct/<int:ordernumber>/', views.order_accept_product, name='order_accept_product'),
    path('strequest-create/', views.strequest_create, name='strequest_create'),
    path('strequest-create-barcodes/', views.strequest_create_barcodes, name='strequest_create_barcodes'),
    path('strequest-search/', views.STRequestSearchListView.as_view(), name='strequest_search'),
    path('strequest-detail/<str:STRequestNumber>/', views.STRequestDetailView.as_view(), name='strequest_detail'),
]
