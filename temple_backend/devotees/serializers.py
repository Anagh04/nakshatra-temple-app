from rest_framework import serializers
from .models import Devotee, DuplicateEntry, InvalidEntry


# ============================================================
# 🔥 SAFE NORMALIZATION FUNCTION
# ============================================================

def normalize_string(value):
    """
    Normalize string safely:
    - lowercase
    - remove spaces only
    """
    return value.strip().lower().replace(" ", "")


# ============================================================
# 🌟 DEVOTEE SERIALIZER
# ============================================================

class DevoteeSerializer(serializers.ModelSerializer):

    class Meta:
        model = Devotee
        fields = "__all__"
        read_only_fields = ["created_at"]

    # ------------------------------
    # NAME VALIDATION
    # ------------------------------
    def validate_name(self, value):
        value = value.strip()

        if not value:
            raise serializers.ValidationError("Name cannot be empty.")

        return value.upper()

    # ------------------------------
    # PHONE VALIDATION
    # ------------------------------
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

    # ------------------------------
    # COUNTRY CODE VALIDATION
    # ------------------------------
    def validate_country_code(self, value):
        value = value.strip()

        if not value.isdigit():
            raise serializers.ValidationError(
                "Country code must contain only digits."
            )

        return value

    # ------------------------------
    # SMART NAKSHATRA VALIDATION
    # ------------------------------
    def validate_nakshatra(self, value):

        input_normalized = normalize_string(value)

        # Build normalized map dynamically from model choices
        normalized_map = {
            normalize_string(choice[0]): choice[0].upper()
            for choice in Devotee.NAKSHATRA_CHOICES
        }

        # ✅ Direct match
        if input_normalized in normalized_map:
            return normalized_map[input_normalized]

        # ✅ Smart phonetic fallback
        for key, original in normalized_map.items():

            # thi <-> thy
            if input_normalized.replace("thi", "thy") == key:
                return original
            if input_normalized.replace("thy", "thi") == key:
                return original

            # bh <-> b
            if input_normalized.replace("bh", "b") == key:
                return original
            if input_normalized.replace("b", "bh") == key:
                return original

        raise serializers.ValidationError("Invalid Nakshatra selected.")

    # ------------------------------
    # DUPLICATE PROTECTION (SAFE FOR UPDATE)
    # ------------------------------
    def validate(self, data):

        name = data.get(
            "name",
            self.instance.name if self.instance else None
        )
        phone = data.get(
            "phone",
            self.instance.phone if self.instance else None
        )
        country_code = data.get(
            "country_code",
            self.instance.country_code if self.instance else None
        )
        nakshatra = data.get(
            "nakshatra",
            self.instance.nakshatra if self.instance else None
        )

        # Skip duplicate check if missing any field
        if not all([name, phone, country_code, nakshatra]):
            return data

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
# 🔁 DUPLICATE ENTRY SERIALIZER
# ============================================================

class DuplicateEntrySerializer(serializers.ModelSerializer):
    class Meta:
        model = DuplicateEntry
        fields = "__all__"
        read_only_fields = ["created_at"]


# ============================================================
# ❌ INVALID ENTRY SERIALIZER
# ============================================================

class InvalidEntrySerializer(serializers.ModelSerializer):
    class Meta:
        model = InvalidEntry
        fields = "__all__"
        read_only_fields = ["created_at"]