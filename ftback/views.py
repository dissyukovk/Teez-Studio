from django.shortcuts import render
from rest_framework.permissions import IsAuthenticated
from rest_framework import generics
from core.models import UserProfile, Product, STRequest
from .serializers import (
    UserProfileSerializer,
    ProductSerializer,
    STRequestSerializer,
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
