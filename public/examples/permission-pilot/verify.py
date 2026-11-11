"""Independent behavior checks. Run against a generated application directory."""
import csv
import io
import json
import os
from pathlib import Path
import sys

sys.path.insert(0, str(Path(sys.argv[1]).resolve()))
os.environ["DJANGO_SETTINGS_MODULE"] = "settings"
import django
django.setup()
from django.core.management import call_command
from django.contrib.auth import get_user_model
from django.test import Client

call_command("migrate", verbosity=0)
User = get_user_model()
accounts = {
    "staff": User.objects.create_user("staff", is_staff=True, is_active=True),
    "member": User.objects.create_user("member", is_staff=False, is_active=True),
    "inactive_staff": User.objects.create_user("inactive", is_staff=True, is_active=False),
}
checks = []
for role in ["anonymous", *accounts]:
    client = Client()
    if role != "anonymous":
        client.force_login(accounts[role])
    for route in ["/users/", "/users/export.csv"]:
        try:
            response = client.get(route)
            permitted = role == "staff"
            denied = response.status_code in (302, 401, 403) and all(
                email not in response.content for email in (b"ada@example.test", b"grace@example.test")
            )
            ok = response.status_code == 200 if permitted else denied
            checks.append({"name": f"{role} {route}", "passed": ok, "status": response.status_code})
            if permitted and route.endswith(".csv"):
                rows = list(csv.reader(io.StringIO(response.content.decode())))
                checks.append({"name": "CSV data", "passed": rows == [
                    ["username", "email"], ["ada", "ada@example.test"], ["grace", "grace@example.test"]
                ]})
                checks.append({"name": "CSV content type", "passed": response.get("Content-Type", "").startswith("text/csv")})
                checks.append({"name": "CSV attachment", "passed": "attachment" in response.get("Content-Disposition", "").lower()})
            if permitted and route == "/users/":
                from html.parser import HTMLParser
                class Links(HTMLParser):
                    hrefs = []
                    def handle_starttag(self, tag, attrs):
                        if tag == "a": self.hrefs.append(dict(attrs).get("href"))
                links = Links(); links.feed(response.content.decode())
                checks.append({"name": "Export link", "passed": "/users/export.csv" in links.hrefs})
        except Exception as error:
            checks.append({"name": f"{role} {route}", "passed": False, "error": type(error).__name__})
print(json.dumps({"passed": all(c["passed"] for c in checks), "checks": checks}))
