from django.db.models.signals import post_save
from django.conf import settings
from django.db import models
from django.db.models import Sum
from django.shortcuts import reverse
from django_countries.fields import CountryField
from django.core.validators import MinValueValidator, MaxValueValidator
from django.db.models import Avg

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

BOOK_TYPE = (
    ('F', 'Fiction'),
    ('N', 'Non-Fiction')
)

ADDRESS_CHOICES = (
    ('B', 'Billing'),
    ('S', 'Shipping'),
)


class UserProfile(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    stripe_customer_id = models.CharField(max_length=50, blank=True, null=True)
    one_click_purchasing = models.BooleanField(default=False)

    def __str__(self):
        return self.user.username


class Item(models.Model):
    # book name
    title = models.CharField(max_length=100)
    price = models.FloatField()
    discount_price = models.FloatField(blank=True, null=True)
    # book genre
    genre = models.CharField(choices=GENRE_CHOICES, max_length=2)
    label = models.CharField(choices=BOOK_TYPE, max_length=1)
    slug = models.SlugField()
    # book description
    description = models.TextField()
    image = models.ImageField()
    # book publishing info
    publisher_info = models.TextField(blank=True, null=True)
    author_name = models.TextField(blank=True, null=True)
    author_bio = models.TextField(blank=True, null=True)
    release_date = models.DateTimeField()

    def __str__(self):
        return self.title

    def get_absolute_url(self):
        return reverse("core:product", kwargs={
            'slug': self.slug
        })

    def get_add_to_cart_url(self):
        return reverse("core:add-to-cart", kwargs={
            'slug': self.slug
        })

    def get_remove_from_cart_url(self):
        return reverse("core:remove-from-cart", kwargs={
            'slug': self.slug
        })

    def get_avg_rating(self):
        rating = Rating.objects.filter(item=self)
        return rating.aggregate(Avg('rating'))


class Comment(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL,
                             on_delete=models.CASCADE)
    username = models.CharField(max_length=100)
    item = models.ForeignKey(Item, on_delete=models.CASCADE)
    book_title = models.CharField(max_length=100)
    timestamp = models.DateTimeField(auto_now_add=True)
    content = models.TextField()

    def __str__(self):
        return self.item.title


class Rating(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL,
                             on_delete=models.CASCADE, related_name='item_ratings')
    username = models.CharField(max_length=100)
    item = models.ForeignKey(Item, on_delete=models.CASCADE)
    book_title = models.CharField(max_length=100)
    timestamp = models.DateTimeField(auto_now_add=True)
    rating = models.IntegerField(
        null=False, blank=False,
        validators=[MinValueValidator(1),
                    MaxValueValidator(10)])

    def __str__(self):
        return self.item.title


class SavedForLaterItem(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL,
                             on_delete=models.CASCADE)
    # book name
    title = models.CharField(max_length=100)
    price = models.FloatField()
    discount_price = models.FloatField(blank=True, null=True)
    # book genre
    genre = models.TextField(blank=True, default='')
    label = models.TextField(blank=True, default='')
    slug = models.SlugField()
    # book description
    description = models.TextField()
    image = models.TextField(blank=True, default='')
    # book publishing info
    publisher_info = models.TextField(blank=True, null=True)
    author_name = models.TextField(blank=True, null=True)
    author_bio = models.TextField(blank=True, null=True)

    # def __str__(self):
    # return self.user.username

    def __str__(self):
        return self.title

    def get_absolute_url(self):
        return reverse("core:product", kwargs={
            'slug': self.slug
        })

    def get_add_to_cart_url(self):
        return reverse("core:add-to-cart", kwargs={
            'slug': self.slug
        })

    def get_remove_from_cart_url(self):
        return reverse("core:remove-from-cart", kwargs={
            'slug': self.slug
        })


class OrderItem(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL,
                             on_delete=models.CASCADE)
    ordered = models.BooleanField(default=False)
    item = models.ForeignKey(Item, on_delete=models.CASCADE)
    quantity = models.IntegerField(default=1)

    def __str__(self):
        return f"{self.quantity} of {self.item.title}"

    def get_total_item_price(self):
        return self.quantity * self.item.price

    def get_total_discount_item_price(self):
        return self.quantity * self.item.discount_price

    def get_amount_saved(self):
        return self.get_total_item_price() - self.get_total_discount_item_price()

    def get_final_price(self):
        if self.item.discount_price:
            return self.get_total_discount_item_price()
        return self.get_total_item_price()


class Order(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL,
                             on_delete=models.CASCADE)
    ref_code = models.CharField(max_length=20, blank=True, null=True)
    items = models.ManyToManyField(OrderItem)
    start_date = models.DateTimeField(auto_now_add=True)
    ordered_date = models.DateTimeField()
    ordered = models.BooleanField(default=False)
    shipping_address = models.ForeignKey(
        'Address', related_name='shipping_address', on_delete=models.SET_NULL, blank=True, null=True)
    billing_address = models.ForeignKey(
        'Address', related_name='billing_address', on_delete=models.SET_NULL, blank=True, null=True)
    payment = models.ForeignKey(
        'Payment', on_delete=models.SET_NULL, blank=True, null=True)
    coupon = models.ForeignKey(
        'Coupon', on_delete=models.SET_NULL, blank=True, null=True)
    being_delivered = models.BooleanField(default=False)
    received = models.BooleanField(default=False)
    refund_requested = models.BooleanField(default=False)
    refund_granted = models.BooleanField(default=False)

    '''
    1. Item added to cart
    2. Adding a billing address
    (Failed checkout)
    3. Payment
    (Preprocessing, processing, packaging etc.)
    4. Being delivered
    5. Received
    6. Refunds
    '''

    def __str__(self):
        return self.user.username

    def get_total(self):
        total = 0
        for order_item in self.items.all():
            total += order_item.get_final_price()
        if self.coupon:
            total -= self.coupon.amount
        return total


class Address(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL,
                             on_delete=models.CASCADE)
    street_address = models.CharField(max_length=100)
    apartment_address = models.CharField(max_length=100)
    country = CountryField(multiple=False)
    zip = models.CharField(max_length=100)
    address_type = models.CharField(max_length=1, choices=ADDRESS_CHOICES)
    default = models.BooleanField(default=False)

    def __str__(self):
        return self.user.username

    class Meta:
        verbose_name_plural = 'Addresses'


class Payment(models.Model):
    stripe_charge_id = models.CharField(max_length=50)
    user = models.ForeignKey(settings.AUTH_USER_MODEL,
                             on_delete=models.SET_NULL, blank=True, null=True)
    amount = models.FloatField()
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.user.username


class Coupon(models.Model):
    code = models.CharField(max_length=15)
    amount = models.FloatField()

    def __str__(self):
        return self.code


class Refund(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE)
    reason = models.TextField()
    accepted = models.BooleanField(default=False)
    email = models.EmailField()

    def __str__(self):
        return f"{self.pk}"


def userprofile_receiver(sender, instance, created, *args, **kwargs):
    if created:
        userprofile = UserProfile.objects.create(user=instance)


post_save.connect(userprofile_receiver, sender=settings.AUTH_USER_MODEL)
