from django.urls import path
from . import views

urlpatterns = [
    path('plans/', views.SubscriptionPlanListView.as_view(), name='subscription-plans'),
    path('my-subscription/', views.MySubscriptionView.as_view(), name='my-subscription'),
]

