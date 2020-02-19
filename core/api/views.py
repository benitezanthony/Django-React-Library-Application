from django_countries import countries
from django.conf import settings
from django.contrib import messages
from django.core.exceptions import ObjectDoesNotExist
from django.http import Http404
from django.shortcuts import render, get_object_or_404
from django.utils import timezone
from rest_framework.generics import (
    ListAPIView, RetrieveAPIView, DestroyAPIView, CreateAPIView, UpdateAPIView)
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.status import HTTP_200_OK, HTTP_400_BAD_REQUEST
from core.models import Item, OrderItem, Order, SavedForLaterItem, Comment, Rating
from .serializers import (ItemSerializer, OrderSerializer, ItemCommentSerializer, ItemRatingSerializer,
                          AddressSerializer, PaymentSerializer, SavedForLaterItemSerializer)
from core.models import Item, OrderItem, Order, Address, Payment, Coupon, Refund, UserProfile
from rest_framework.pagination import PageNumberPagination
from django.db.models import Avg

import stripe

stripe.api_key = settings.STRIPE_SECRET_KEY


GENRE_CHOICES = (
    # Fiction
    ('AA', 'Action and adventure'),
    ('AH', 'Alternate history'),
    ('AT', 'Anthology'),
    ('CH', 'Childrens'),
    ('CO', 'Comic book'),
    ('CR', 'Crime'),
    ('DR', 'Drama'),
    ('FT', 'Fairytale'),
    ('FA', 'Fantasy'),
    ('GN', 'Graphic novel'),
    ('HF', 'Historical fiction'),
    ('HO', 'Horror'),
    ('MY', 'Mystery'),
    ('PO', 'Poetry'),
    ('PT', 'Political thriller'),
    ('RO', 'Romance'),
    ('SF', 'Science fiction'),
    ('SS', 'Short story'),
    ('SP', 'Suspense'),
    ('TH', 'Thriller'),

    # Non-Fiction
    ('AR', 'Art'),
    ('AB', 'Autobiography'),
    ('BO', 'Biography'),
    ('BR', 'Book review'),
    ('CB', 'Cookbook'),
    ('DI', 'Diary'),
    ('EN', 'Encyclopedia'),
    ('GU', 'Guide'),
    ('HE', 'Health'),
    ('HI', 'History'),
    ('JO', 'Journal'),
    ('MA', 'Math'),
    ('ME', 'Memoir'),
    ('RS', 'Religion, spirituality, and new age'),
    ('TB', 'Textbook'),
    ('RE', 'Review'),
    ('SC', 'Science'),
    ('SH', 'Self help'),
    ('TR', 'Travel'),
)


class UserIDView(APIView):
    def get(self, request, *args, **kwargs):
        return Response({'userID': request.user.id,
                         'username': request.user.username},
                        status=HTTP_200_OK)


class ItemListView(ListAPIView):
    permission_classes = (AllowAny,)
    serializer_class = ItemSerializer
    queryset = Item.objects.all()
    pagination_class = PageNumberPagination


class SavedForLaterListView(ListAPIView):
    permission_classes = (IsAuthenticated,)
    serializer_class = SavedForLaterItemSerializer

    def get_queryset(self):
        # initial query set
        qs = SavedForLaterItem.objects.all()
        queryset = qs.filter(user=self.request.user)
        return queryset


class SavedForLaterItemCreateView(CreateAPIView):
    permission_classes = (IsAuthenticated,)
    serializer_class = SavedForLaterItemSerializer
    queryset = SavedForLaterItem.objects.all()


class SavedForLaterItemDeleteView(DestroyAPIView):
    permission_classes = (IsAuthenticated,)
    queryset = SavedForLaterItem.objects.all()


class ItemDetailView(RetrieveAPIView):
    permission_classes = (AllowAny,)
    serializer_class = ItemSerializer
    queryset = Item.objects.all()


class ItemCommentView(ListAPIView):
    permission_classes = (AllowAny,)
    serializer_class = ItemCommentSerializer

    def get_queryset(self):
        book_title = self.request.query_params.get('book_title', None)
        # initial query set
        qs = Comment.objects.all()
        if book_title is None:
            return qs
        return qs.filter(book_title=book_title)


class ItemRatingView(ListAPIView):
    permission_classes = (AllowAny,)
    serializer_class = ItemRatingSerializer

    def get_queryset(self):
        book_title = self.request.query_params.get('book_title', None)
        # initial query set
        qs = Rating.objects.all()
        if book_title is None:
            return qs
        return qs.filter(book_title=book_title)


class AuthorListView(ListAPIView):
    permission_classes = (AllowAny,)
    serializer_class = ItemSerializer

    def get_queryset(self):
        author_name = self.request.query_params.get('author_name', None)
        # initial query set
        qs = Item.objects.all()

        if author_name is None:
            return qs
        return qs.filter(author_name=author_name)

    # pagination_class = PageNumberPagination


class GenreChoiceListView(APIView):
    def get(self, request, *args, **kwargs):
        return Response(GENRE_CHOICES, status=HTTP_200_OK)


class BrowseAndSort(ListAPIView):
    permission_classes = (AllowAny,)
    serializer_class = ItemSerializer

    def get_queryset(self):
        # initial query set
        qs = Item.objects.all()
        # browseBy values may be: GENRE_CHOICES (dictionary values), top sellers list, book rating category
        browseBy = self.request.query_params.get('browseBy', None)
        # sortBy values may be: author_name, price, release_date (model fields), rating (calculated in view)
        sortBy = self.request.query_params.get('sortBy', None)

        if browseBy == 'null' and sortBy == 'null':
            return qs

        genre_dict = dict(GENRE_CHOICES)
        # if genre found inside genre dictionary, query filters by genre
        if browseBy in genre_dict and browseBy != 'null':
            if sortBy == 'null':
                return qs.filter(genre=browseBy)
            else:
                # if the sorting method is by rating
                if sortBy == 'rating':
                    # This will return one result for each book in the database,
                    # rating__rating refers to the Rating model, and the field 'rating'
                    return qs.filter(genre=browseBy).annotate(
                        average_rating=Avg('rating__rating')
                    ).order_by('-average_rating')  # order by descending values
                # every other sorting method:
                return qs.filter(genre=browseBy).order_by(sortBy)

        elif sortBy != 'null':
            # if the sorting method is by rating
            if sortBy == 'rating':
                # This will return one result for each book in the database,
                # rating__rating refers to the Rating model, and the field 'rating'
                return qs.annotate(
                    average_rating=Avg('rating__rating')
                ).order_by('-average_rating')  # order by descending values
            # every other sorting method:
            return qs.order_by(sortBy)


class AddressListView(ListAPIView):
    permission_classes = (IsAuthenticated,)
    serializer_class = AddressSerializer

    def get_queryset(self):
        address_type = self.request.query_params.get('address_type', None)
        # initial query set
        qs = Address.objects.all()
        if address_type is None:
            return qs
        return qs.filter(user=self.request.user, address_type=address_type)


class OrderQuantityUpdateView(APIView):
    def post(self, request, *args, **kwargs):
        slug = request.data.get('slug', None)
        if slug is None:
            return Response({"message": "Invalid data"}, status=HTTP_400_BAD_REQUEST)
        item = get_object_or_404(Item, slug=slug)
        order_qs = Order.objects.filter(
            user=request.user,
            ordered=False
        )
        if order_qs.exists():
            order = order_qs[0]
            # check if the order item is in the order
            if order.items.filter(item__slug=item.slug).exists():
                order_item = OrderItem.objects.filter(
                    item=item,
                    user=request.user,
                    ordered=False
                )[0]
                if order_item.quantity > 1:
                    order_item.quantity -= 1
                    order_item.save()
                else:
                    order.items.remove(order_item)
                    # This item quantity was updated
                return Response(status=HTTP_200_OK)
            else:
                return Response({"message": "This item was not in your cart"}, status=HTTP_400_BAD_REQUEST)

        else:
            return Response({"message": "You do not have an active order"}, status=HTTP_400_BAD_REQUEST)


class OrderItemDeleteView(DestroyAPIView):
    permission_classes = {IsAuthenticated, }
    queryset = OrderItem.objects.all()


class AddToCartView(APIView):
    def post(self, request, *args, **kwargs):
        slug = request.data.get('slug', None)
        if slug is None:
            return Response({'message': 'Invalid Request'}, status=HTTP_400_BAD_REQUEST)
        item = get_object_or_404(Item, slug=slug)
        order_item, created = OrderItem.objects.get_or_create(
            item=item,
            user=request.user,
            ordered=False
        )
        order_qs = Order.objects.filter(user=request.user, ordered=False)
        if order_qs.exists():
            order = order_qs[0]
            # check if the order item is in the order
            if order.items.filter(item__slug=item.slug).exists():
                order_item.quantity += 1
                order_item.save()
                return Response(status=HTTP_200_OK)
            else:
                order.items.add(order_item)
                return Response(status=HTTP_200_OK)
        else:
            ordered_date = timezone.now()
            order = Order.objects.create(
                user=request.user, ordered_date=ordered_date)
            order.items.add(order_item)
            return Response(status=HTTP_200_OK)


class OrderDetailView(RetrieveAPIView):
    serializer_class = OrderSerializer
    permission_classes = (IsAuthenticated,)

    def get_object(self):
        try:
            order = Order.objects.get(user=self.request.user, ordered=False)
            return order
        except ObjectDoesNotExist:
            raise Http404("You do not have an active order")
            # return Response({'message': "You do not have an active order"}, status=HTTP_400_BAD_REQUEST)


class PaymentView(APIView):

    def post(self, request, *args, **kwargs):
        order = Order.objects.get(user=self.request.user, ordered=False)
        userprofile = UserProfile.objects.get(user=self.request.user)

        token = request.data.get('stripeToken')
        billing_address_id = request.data.get('selectedBillingAddress')
        shipping_address_id = request.data.get('selectedShippingAddress')

        billing_address = Address.objects.get(id=billing_address_id)
        shipping_address = Address.objects.get(id=shipping_address_id)

        if userprofile.stripe_customer_id != '' and userprofile.stripe_customer_id is not None:
            customer = stripe.Customer.retrieve(
                userprofile.stripe_customer_id)
            customer.sources.create(source=token)

        else:
            customer = stripe.Customer.create(
                email=self.request.user.email,
            )
            customer.sources.create(source=token)
            userprofile.stripe_customer_id = customer['id']
            userprofile.one_click_purchasing = True
            userprofile.save()

        amount = int(order.get_total() * 100)

        try:

            # charge the customer because we cannot charge the token more than once
            charge = stripe.Charge.create(
                amount=amount,  # cents
                currency="usd",
                customer=userprofile.stripe_customer_id
            )

            # charge once off on the token
            ''' charge = stripe.Charge.create(
                amount=amount,  # cents
                currency="usd",
                source=token
            ) '''

            # create the payment
            payment = Payment()
            payment.stripe_charge_id = charge['id']
            payment.user = self.request.user
            payment.amount = order.get_total()
            payment.save()

            # assign the payment to the order

            order_items = order.items.all()
            order_items.update(ordered=True)
            for item in order_items:
                item.save()

            order.ordered = True
            order.payment = payment
            order.billing_address = billing_address
            order.shipping_address = shipping_address
            # order.ref_code = create_ref_code()
            order.save()

            return Response(status=HTTP_200_OK)

        except stripe.error.CardError as e:
            body = e.json_body
            err = body.get('error', {})
            return Response({"message": f"{err.get('message')}"}, status=HTTP_400_BAD_REQUEST)

        except stripe.error.RateLimitError as e:
            # Too many requests made to the API too quickly
            messages.warning(self.request, "Rate limit error")
            return Response({"message": "Rate limit error"}, status=HTTP_400_BAD_REQUEST)

        except stripe.error.InvalidRequestError as e:
            # Invalid parameters were supplied to Stripe's API
            return Response({"message": "Invalid parameters"}, status=HTTP_400_BAD_REQUEST)

        except stripe.error.AuthenticationError as e:
            # Authentication with Stripe's API failed
            # (maybe you changed API keys recently)
            return Response({"message": "Not authenticated"}, status=HTTP_400_BAD_REQUEST)

        except stripe.error.APIConnectionError as e:
            # Network communication with Stripe failed
            return Response({"message": "Network error"}, status=HTTP_400_BAD_REQUEST)

        except stripe.error.StripeError as e:
            # Display a very generic error to the user, and maybe send
            # yourself an email
            return Response({"message": "Something went wrong. You were not charged. Please try again."},
                            status=HTTP_400_BAD_REQUEST)

        except Exception as e:
            # send an email to ourselves
            return Response({"message": "A serious error occurred. We have been notifed."}, status=HTTP_400_BAD_REQUEST)

        return Response({"message": "Invalid data received"}, status=HTTP_400_BAD_REQUEST)


class AddCouponView(APIView):
    def post(self, request, *args, **kwargs):
        code = request.data.get('code', None)
        if code is None:
            return Response({"message": "Invalid data received"}, status=HTTP_400_BAD_REQUEST)
        order = Order.objects.get(
            user=self.request.user, ordered=False)
        coupon = get_object_or_404(Coupon, code=code)
        order.coupon = coupon
        order.save()
        return Response(status=HTTP_200_OK)


class AddressCreateView(CreateAPIView):
    permission_classes = (IsAuthenticated,)
    serializer_class = AddressSerializer
    queryset = Address.objects.all()


class CountryListView(APIView):
    def get(self, request, *args, **kwargs):
        return Response(countries, status=HTTP_200_OK)


class AddressUpdateView(UpdateAPIView):
    permission_classes = (IsAuthenticated,)
    serializer_class = AddressSerializer
    queryset = Address.objects.all()


class AddressDeleteView(DestroyAPIView):
    permission_classes = (IsAuthenticated,)
    queryset = Address.objects.all()


class PaymentListView(ListAPIView):
    permission_classes = (IsAuthenticated,)
    serializer_class = PaymentSerializer

    def get_queryset(self):
        return Payment.objects.filter(user=self.request.user)
