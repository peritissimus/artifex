from django.urls import path
from views import login, users, users_export_csv

urlpatterns = [
    path("users/", users, name="users"),
    path("users/export.csv", users_export_csv, name="users_export_csv"),
    path("login/", login, name="login"),
]
