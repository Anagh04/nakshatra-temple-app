from django.urls import path
from rest_framework.routers import DefaultRouter
from .views import DevoteeViewSet, register

router = DefaultRouter()
router.register(r'devotees', DevoteeViewSet, basename='devotee')

urlpatterns = [
    path('register/', register),
]

urlpatterns += router.urls
