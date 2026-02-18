from rest_framework import viewsets, status
from rest_framework.decorators import api_view, permission_classes, parser_classes
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.parsers import JSONParser, MultiPartParser, FormParser

from django.contrib.auth.models import User
from django.db import IntegrityError

import pandas as pd

from .models import Devotee
from .serializers import DevoteeSerializer


# ============================================================
# Devotee ViewSet (JWT Protected)
# ============================================================
class DevoteeViewSet(viewsets.ModelViewSet):
    queryset = Devotee.objects.all().order_by("created_at")
    serializer_class = DevoteeSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = super().get_queryset()
        nakshatra = self.request.query_params.get("nakshatra")

        if nakshatra:
            queryset = queryset.filter(nakshatra=nakshatra)

        return queryset


# ============================================================
# REGISTER API (Public)
# ============================================================
@api_view(["POST"])
@permission_classes([AllowAny])
@parser_classes([JSONParser])
def register(request):

    username = request.data.get("username", "").strip()
    email = request.data.get("email", "").strip()
    password = request.data.get("password", "").strip()

    # Debug (remove later if needed)
    print("REGISTER DATA:", request.data)

    if not username or not email or not password:
        return Response(
            {
                "error": "All fields are required",
                "received_data": request.data,
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    if User.objects.filter(username=username).exists():
        return Response(
            {"error": "Username already exists"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if User.objects.filter(email=email).exists():
        return Response(
            {"error": "Email already registered"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        User.objects.create_user(
            username=username,
            email=email,
            password=password,
        )
    except IntegrityError:
        return Response(
            {"error": "User creation failed"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    return Response(
        {"message": "User registered successfully"},
        status=status.HTTP_201_CREATED,
    )


# ============================================================
# BULK FILE UPLOAD (CSV + XLSX Supported)
# ============================================================
@api_view(["POST"])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser, FormParser])
def bulk_upload(request):

    file = request.FILES.get("file")
    selected_nakshatra = request.data.get("nakshatra")

    if not file:
        return Response(
            {"error": "No file uploaded"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if not selected_nakshatra:
        return Response(
            {"error": "Nakshatra is required"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        if file.name.endswith(".csv"):
            df = pd.read_csv(file)
        elif file.name.endswith(".xlsx"):
            df = pd.read_excel(file, engine="openpyxl")
        else:
            return Response(
                {"error": "Upload CSV or XLSX file"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        df.columns = df.columns.str.strip().str.lower()

        required_columns = {"name", "phone"}
        if not required_columns.issubset(set(df.columns)):
            return Response(
                {
                    "error": f"Required columns missing. Needed: {required_columns}"
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        created_count = 0
        duplicate_count = 0
        invalid_count = 0

        for _, row in df.iterrows():
            name = str(row.get("name", "")).strip()

            phone_raw = row.get("phone")
            phone = ""

            if pd.notna(phone_raw):
                try:
                    phone = str(int(float(phone_raw)))
                except:
                    phone = str(phone_raw).strip()

            country_code = str(row.get("countrycode", "")).strip()

            if not name or not phone:
                invalid_count += 1
                continue

            exists = Devotee.objects.filter(
                name=name,
                CountryCode=country_code,
                phone=phone
            ).exists()

            if exists:
                duplicate_count += 1
                continue

            Devotee.objects.create(
                name=name,
                phone=phone,
                nakshatra=selected_nakshatra,
                CountryCode=country_code,
            )

            created_count += 1

        return Response(
            {
                "message": "Bulk upload completed",
                "created": created_count,
                "duplicates": duplicate_count,
                "invalid": invalid_count,
            },
            status=status.HTTP_200_OK,
        )

    except Exception as e:
        return Response(
            {"error": f"File processing error: {str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


# ============================================================
# DELETE ALL DEVOTEES OF A NAKSHATRA
# ============================================================
@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
def delete_nakshatra_data(request, nakshatra_name):

    devotees = Devotee.objects.filter(nakshatra=nakshatra_name)

    if not devotees.exists():
        return Response(
            {"message": "No devotees found"},
            status=status.HTTP_404_NOT_FOUND,
        )

    deleted_count = devotees.count()
    devotees.delete()

    return Response(
        {
            "message": f"{deleted_count} devotees deleted successfully",
            "deleted": deleted_count,
        },
        status=status.HTTP_200_OK,
    )
