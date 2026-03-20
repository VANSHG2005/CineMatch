"""
One-time migration script for production DB.
Run this from the Render Shell:
    python create_comments_table.py

What it does:
  1. Alters password_hash column to TEXT (fixes login 500 errors)
  2. Creates the `comments` table if it doesn't exist (fixes comments 500 errors)
"""
from app import create_app
from models.user import db
from sqlalchemy import text

app = create_app()

def run_migrations():
    with app.app_context():
        print("=" * 50)
        print("Running production DB migrations...")
        print("=" * 50)

        # --- Fix 1: password_hash column type ---
        # The column was VARCHAR(128) which is too short for bcrypt hashes.
        # This caused login to 500 instead of returning 401.
        try:
            db.session.execute(text('ALTER TABLE "user" ALTER COLUMN password_hash TYPE TEXT;'))
            db.session.commit()
            print("[OK] password_hash column altered to TEXT.")
        except Exception as e:
            db.session.rollback()
            # "already TEXT" or "column does not exist" both land here - safe to ignore
            print(f"[SKIP] password_hash alter: {e}")

        # --- Fix 2: Create comments table ---
        # This table was never migrated to production PostgreSQL.
        try:
            db.session.execute(text("""
                CREATE TABLE IF NOT EXISTS comments (
                    id         SERIAL PRIMARY KEY,
                    user_id    VARCHAR(36) NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
                    item_id    INTEGER NOT NULL,
                    item_type  VARCHAR(10) NOT NULL,
                    text       TEXT NOT NULL,
                    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
                );
            """))
            db.session.execute(text("""
                CREATE INDEX IF NOT EXISTS ix_comments_item
                ON comments (item_id, item_type);
            """))
            db.session.commit()
            print("[OK] `comments` table created (or already existed).")
        except Exception as e:
            db.session.rollback()
            print(f"[FAIL] Could not create comments table: {e}")
            raise

        print("=" * 50)
        print("All migrations complete.")
        print("=" * 50)

if __name__ == "__main__":
    run_migrations()