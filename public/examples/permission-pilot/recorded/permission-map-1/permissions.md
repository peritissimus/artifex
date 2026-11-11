# Effective directory permissions

`/users/` -> `views.users` -> `staff_member_required`

Directory responses require authenticated AND active AND staff users.
A new endpoint returning the same records needs the same policy.
This is documentation of the existing decorator, not an enforced route registry.
