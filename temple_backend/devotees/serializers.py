from rest_framework import serializers
from .models import Devotee, DuplicateEntry, InvalidEntry


# ============================================================
# 🔥 SMART NORMALIZATION FUNCTION
# ============================================================

def normalize_string(value):
    """
    Normalize string for safe comparison:
    - lowercase
    - remove spaces
    - remove common phonetic variations
    """

    value = value.strip().lower()
    value = value.replace(" ", "")
    value = value.replace("sh", "s")
    value = value.replace("oo", "u")
    value = value.replace("aa", "a")
    return value


# ============================================================
# DEVOTEE SERIALIZER
# ============================================================

class DevoteeSerializer(serializers.ModelSerializer):

    class Meta:
        model = Devotee
        fields = "__all__"
        read_only_fields = ["created_at"]

        extra_kwargs = {
            "name": {
                "error_messages": {
                    "blank": "Name is required.",
                    "required": "Name is required."
                }
            },
            "phone": {
                "error_messages": {
                    "blank": "Phone number is required.",
                    "required": "Phone number is required."
                }
            },
            "nakshatra": {
                "error_messages": {
                    "blank": "Nakshatra is required.",
                    "required": "Nakshatra is required."
                }
            }
        }

    # ------------------------------
    # FIELD VALIDATIONS
    # ------------------------------

    def validate_name(self, value):
        value = value.strip()

        if not value:
            raise serializers.ValidationError("Name cannot be empty.")

        return value.upper()

    def validate_phone(self, value):
        value = value.strip()

        if not value.isdigit():
            raise serializers.ValidationError(
                "Phone number must contain only digits."
            )

        if len(value) < 7:
            raise serializers.ValidationError(
                "Phone number is too short."
            )

        return value

    def validate_country_code(self, value):
        value = value.strip()

        if not value.isdigit():
            raise serializers.ValidationError(
                "Country code must contain only digits."
            )

        return value

    # ------------------------------
    # SMART NAKSHATRA MATCHING
    # ------------------------------

    def validate_nakshatra(self, value):

        input_normalized = normalize_string(value)

        valid_choices = Devotee.NAKSHATRA_CHOICES

        normalized_map = {
            normalize_string(choice[0]): choice[0].upper()
            for choice in valid_choices
        }

        if input_normalized not in normalized_map:
            raise serializers.ValidationError(
                "Invalid Nakshatra selected."
            )

        return normalized_map[input_normalized]

    # ------------------------------
    # DUPLICATE PROTECTION
    # ------------------------------

    def validate(self, data):

        name = data.get("name")
        phone = data.get("phone")
        country_code = data.get("country_code")
        nakshatra = data.get("nakshatra")

        queryset = Devotee.objects.filter(
            name=name,
            phone=phone,
            country_code=country_code,
            nakshatra=nakshatra
        )

        if self.instance:
            queryset = queryset.exclude(id=self.instance.id)

        if queryset.exists():
            raise serializers.ValidationError({
                "duplicate": "This devotee is already registered under this Nakshatra."
            })

        return data


# ============================================================
# DUPLICATE ENTRY SERIALIZER
# ============================================================

class DuplicateEntrySerializer(serializers.ModelSerializer):
    class Meta:
        model = DuplicateEntry
        fields = "__all__"


# ============================================================
# INVALID ENTRY SERIALIZER
# ============================================================

class InvalidEntrySerializer(serializers.ModelSerializer):
    class Meta:
        model = InvalidEntry
        fields = "__all__"
