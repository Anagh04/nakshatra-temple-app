from django.urls import path
from rest_framework.routers import DefaultRouter
from .views import (
    DevoteeViewSet,
    DuplicateEntryViewSet,
    InvalidEntryViewSet,
    register,
    bulk_upload,
    delete_nakshatra_data,
)

router = DefaultRouter()

# Main Devotee table
router.register(r'devotees', DevoteeViewSet, basename='devotee')

# 🔥 Corrected routes
router.register(r'duplicates', DuplicateEntryViewSet, basename='duplicate')
router.register(r'invalids', InvalidEntryViewSet, basename='invalid')

urlpatterns = [

    path('register/', register, name='register-devotee'),

    path('bulk-upload/', bulk_upload, name='bulk-upload'),

    path(
        'delete-nakshatra/<str:nakshatra_name>/',
        delete_nakshatra_data,
        name='delete-nakshatra'
    ),
]

urlpatterns += router.urls
