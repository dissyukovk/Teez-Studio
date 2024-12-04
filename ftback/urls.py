from django.urls import path
from . import views

urlpatterns = [
    path('users/', views.UserProfileListCreateView.as_view(), name='userprofile-list'),
    path('users/<int:pk>/', views.UserProfileDetailView.as_view(), name='userprofile-detail'),
    path('products/', views.ProductListCreateView.as_view(), name='product-list'),
    path('products/<int:pk>/', views.ProductDetailView.as_view(), name='product-detail'),
    path('strequests/', views.STRequestListCreateView.as_view(), name='strequest-list'),
    path('strequests/<int:pk>/', views.STRequestDetailView.as_view(), name='strequest-detail'),
]
