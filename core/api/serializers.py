from rest_framework import serializers
from core.models import (Address, Item, Order, OrderItem, Coupon,
                         Payment, SavedForLaterItem, Comment, Rating)
from django_countries.serializer_fields import CountryField


class StringSerializer(serializers.StringRelatedField):
    def to_internal_value(self, value):
        return value


class CouponSerializer(serializers.ModelSerializer):
    class Meta:
        model = Coupon
        fields = (
            'id',
            'code',
            'amount'
        )


class ItemSerializer(serializers.ModelSerializer):
    genre = serializers.SerializerMethodField()
    label = serializers.SerializerMethodField()
    avg_rating = serializers.SerializerMethodField()

    class Meta:
        model = Item
        fields = (
            'id',
            'title',
            'price',
            'discount_price',
            'genre',
            'label',
            'slug',
            'description',
            'image',
            'publisher_info',
            'author_bio',
            'author_name',
            'avg_rating',
            'release_date'
        )

    def get_genre(self, obj):
        return obj.get_genre_display()

    def get_label(self, obj):
        return obj.get_label_display()

    def get_avg_rating(self, obj):
        return obj.get_avg_rating()


class ItemCommentSerializer(serializers.ModelSerializer):
    item = StringSerializer()

    class Meta:
        model = Comment
        fields = (
            'user',
            'username',
            'item',
            'timestamp',
            'content',
            'book_title'
        )

    def get_book_title(self, obj):
        return ItemSerializer(obj.item).data.title

    def get_username(self, obj):
        return ItemSerializer(obj.user).data.username


class ItemRatingSerializer(serializers.ModelSerializer):
    item = StringSerializer()

    class Meta:
        model = Rating
        fields = (
            'user',
            'username',
            'item',
            'timestamp',
            'rating',
            'book_title'
        )

    def get_book_title(self, obj):
        return ItemSerializer(obj.item).data.title

    def get_username(self, obj):
        return ItemSerializer(obj.user).data.username


class SavedForLaterItemSerializer(serializers.ModelSerializer):

    class Meta:
        model = SavedForLaterItem
        fields = (
            'user',
            'id',
            'title',
            'price',
            'discount_price',
            'genre',
            'label',
            'slug',
            'description',
            'image',
            'publisher_info',
            'author_bio',
            'author_name',
        )


class OrderItemSerializer(serializers.ModelSerializer):
    item = StringSerializer()
    item_obj = serializers.SerializerMethodField()
    final_price = serializers.SerializerMethodField()

    class Meta:
        model = OrderItem
        fields = (
            'id',
            'item',
            'item_obj',
            'quantity',
            'final_price'
        )

    def get_item_obj(self, obj):
        return ItemSerializer(obj.item).data

    def get_final_price(self, obj):
        return obj.get_final_price()


class OrderSerializer(serializers.ModelSerializer):
    order_items = serializers.SerializerMethodField()
    total = serializers.SerializerMethodField()
    coupon = serializers.SerializerMethodField()

    class Meta:
        model = Order
        fields = (
            'id',
            'order_items',
            'total',
            'coupon'
        )

    def get_order_items(self, obj):
        return OrderItemSerializer(obj.items.all(), many=True).data

    def get_total(self, obj):
        return obj.get_total()

    def get_coupon(self, obj):
        if obj.coupon is not None:
            return CouponSerializer(obj.coupon).data
        return None


class AddressSerializer(serializers.ModelSerializer):
    country = CountryField()

    class Meta:
        model = Address
        fields = (
            'id',
            'user',
            'street_address',
            'apartment_address',
            'country',
            'zip',
            'address_type',
            'default'
        )


class PaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = (
            'id',
            'amount',
            'timestamp'
        )
