from app import create_app
from models.user import db
from sqlalchemy import text

app = create_app()

def fix_db():
    with app.app_context():
        print("Updating database column size...")
        try:
            # Change the column type directly in Postgres
            db.session.execute(text('ALTER TABLE "user" ALTER COLUMN password_hash TYPE TEXT;'))
            db.session.commit()
            print("Successfully updated password_hash to TEXT.")
        except Exception as e:
            print(f"Update failed or already applied: {e}")

if __name__ == "__main__":
    fix_db()
