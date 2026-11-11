from django.contrib.admin.views.decorators import staff_member_required
from django.http import HttpResponse

DIRECTORY = [
    {"username": "ada", "email": "ada@example.test"},
    {"username": "grace", "email": "grace@example.test"},
]


@staff_member_required(login_url="/login/")
def users(request):
    rows = "".join(f"<li>{row['username']}: {row['email']}</li>" for row in DIRECTORY)
    return HttpResponse(f"<h1>Users</h1><ul>{rows}</ul>")


def login(request):
    return HttpResponse("Sign in through your staff account.")
