from django.urls import path
from views import export_users_csv, login, users

urlpatterns = [
    path("users/", users, name="users"),
    path("users/export.csv", export_users_csv, name="users_export_csv"),
    path("login/", login, name="login"),
]
