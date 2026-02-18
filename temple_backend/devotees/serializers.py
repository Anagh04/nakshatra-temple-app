from rest_framework import serializers
from .models import Devotee


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

    # ✅ FIELD CLEANING + VALIDATION
    def validate(self, data):

        name = data.get("name", "").strip()
        phone = data.get("phone", "").strip()
        country_code = data.get("country_code", "").strip()
        nakshatra = data.get("nakshatra")

        # Clean data
        data["name"] = name
        data["phone"] = phone
        data["country_code"] = country_code

        # Extra safety validation
        if not name:
            raise serializers.ValidationError({
                "name": "Name cannot be empty."
            })

        if not phone:
            raise serializers.ValidationError({
                "phone": "Phone number cannot be empty."
            })

        # 🔁 Duplicate check (name + phone + country_code + nakshatra)
        queryset = Devotee.objects.filter(
            name=name,
            phone=phone,
            country_code=country_code,
            nakshatra=nakshatra,
        )

        # Allow update without self-conflict
        if self.instance:
            queryset = queryset.exclude(id=self.instance.id)

        if queryset.exists():
            raise serializers.ValidationError({
                "duplicate": "This devotee is already registered under this Nakshatra."
            })

        return data
