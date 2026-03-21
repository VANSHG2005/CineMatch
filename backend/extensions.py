"""
extensions.py — shared Flask extension instances.

Keeping them here breaks the circular import between app.py and api_routes.py.
Both files import from here instead of from each other.
"""
from flask_mail import Mail

mail = Mail()