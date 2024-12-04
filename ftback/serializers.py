from rest_framework import serializers
from core.models import UserProfile, Product, STRequest

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
