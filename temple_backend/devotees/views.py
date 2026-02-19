# ============================================================
# IMPORTS
# ============================================================

from rest_framework import viewsets, status
from rest_framework.decorators import api_view, permission_classes, parser_classes
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.parsers import JSONParser, MultiPartParser, FormParser

from django.contrib.auth.models import User
from django.db import IntegrityError

import pandas as pd

from .models import Devotee, DuplicateEntry, InvalidEntry
from .serializers import (
    DevoteeSerializer,
    DuplicateEntrySerializer,
    InvalidEntrySerializer,
)


# ============================================================
# DEVOTEE VIEWSET
# ============================================================

class DevoteeViewSet(viewsets.ModelViewSet):
    queryset = Devotee.objects.all().order_by("-created_at")
    serializer_class = DevoteeSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = super().get_queryset()
        nakshatra = self.request.query_params.get("nakshatra")

        if nakshatra:
            queryset = queryset.filter(nakshatra=nakshatra.upper())

        return queryset


# ============================================================
# DUPLICATE ENTRY VIEWSET
# ============================================================

class DuplicateEntryViewSet(viewsets.ModelViewSet):
    queryset = DuplicateEntry.objects.all().order_by("-created_at")
    serializer_class = DuplicateEntrySerializer
    permission_classes = [IsAuthenticated]


# ============================================================
# INVALID ENTRY VIEWSET
# ============================================================

class InvalidEntryViewSet(viewsets.ModelViewSet):
    queryset = InvalidEntry.objects.all().order_by("-created_at")
    serializer_class = InvalidEntrySerializer
    permission_classes = [IsAuthenticated]


# ============================================================
# REGISTER API
# ============================================================

@api_view(["POST"])
@permission_classes([AllowAny])
@parser_classes([JSONParser])
def register(request):

    username = request.data.get("username", "").strip()
    email = request.data.get("email", "").strip()
    password = request.data.get("password", "").strip()

    if not username or not email or not password:
        return Response(
            {"error": "All fields are required"},
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
# BULK FILE UPLOAD
# ============================================================

@api_view(["POST"])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser, FormParser])
def bulk_upload(request):

    file = request.FILES.get("file")

    if not file:
        return Response(
            {"error": "No file uploaded"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:

        # Read file
        if file.name.endswith(".csv"):
            df = pd.read_csv(file)
        elif file.name.endswith(".xlsx"):
            df = pd.read_excel(file, engine="openpyxl")
        else:
            return Response(
                {"error": "Upload CSV or XLSX file only"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Clean column names
        df.columns = (
            df.columns
            .str.strip()
            .str.lower()
            .str.replace(" ", "")
        )

        # Rename columns
        column_mapping = {}

        for col in df.columns:
            if col in ["name"]:
                column_mapping[col] = "name"
            elif col in ["countrycode", "country_code"]:
                column_mapping[col] = "countrycode"
            elif col in ["phone", "phoneno", "phonenumber"]:
                column_mapping[col] = "phone"
            elif col in ["nakshatra"]:
                column_mapping[col] = "nakshatra"

        df = df.rename(columns=column_mapping)

        required_columns = {"name", "countrycode", "phone", "nakshatra"}

        if not required_columns.issubset(set(df.columns)):
            return Response(
                {"error": f"Missing required columns: {required_columns}"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        valid_nakshatras = [
            choice[0].upper() for choice in Devotee.NAKSHATRA_CHOICES
        ]

        created_count = 0
        duplicate_count = 0
        invalid_count = 0

        for _, row in df.iterrows():

            name = str(row.get("name", "")).strip().upper()
            country_code = str(row.get("countrycode", "")).strip()
            phone_raw = row.get("phone")
            raw_nakshatra = str(row.get("nakshatra", "")).strip().lower()

            phone = ""
            if pd.notna(phone_raw):
                try:
                    phone = str(int(float(phone_raw)))
                except:
                    phone = str(phone_raw).strip()

            # Missing fields
            if not name or not phone or not raw_nakshatra or not country_code:
                InvalidEntry.objects.create(
                    name=name,
                    country_code=country_code,
                    phone=phone,
                    nakshatra=raw_nakshatra.upper(),
                    reason="Missing required fields",
                )
                invalid_count += 1
                continue

            raw_nakshatra = raw_nakshatra.replace("shw", "sw")
            formatted_nakshatra = raw_nakshatra.upper()

            # Invalid nakshatra
            if formatted_nakshatra not in valid_nakshatras:
                InvalidEntry.objects.create(
                    name=name,
                    country_code=country_code,
                    phone=phone,
                    nakshatra=formatted_nakshatra,
                    reason="Invalid Nakshatra",
                )
                invalid_count += 1
                continue

            # Duplicate check
            exists = Devotee.objects.filter(
                name=name,
                phone=phone,
                country_code=country_code,
                nakshatra=formatted_nakshatra,
            ).exists()

            if exists:
                DuplicateEntry.objects.create(
                    name=name,
                    country_code=country_code,
                    phone=phone,
                    nakshatra=formatted_nakshatra,
                )
                duplicate_count += 1
                continue

            Devotee.objects.create(
                name=name,
                phone=phone,
                country_code=country_code,
                nakshatra=formatted_nakshatra,
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
# DELETE ALL DEVOTEES UNDER A NAKSHATRA
# ============================================================

@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
def delete_nakshatra_data(request, nakshatra_name):

    nakshatra_name = nakshatra_name.strip().lower()
    nakshatra_name = nakshatra_name.replace("shw", "sw")
    nakshatra_name = nakshatra_name.upper()

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
