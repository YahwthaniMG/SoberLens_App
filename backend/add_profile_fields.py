"""
Script de migracion para agregar name y age_range a la tabla users.
Ejecutar una vez: python add_profile_fields.py
"""

import sqlite3, os

db_path = os.getenv("DATABASE_URL", "sqlite:///./soberlens.db").replace(
    "sqlite:///", ""
)
conn = sqlite3.connect(db_path)
cur = conn.cursor()

for col, typedef in [("name", "VARCHAR(64)"), ("age_range", "VARCHAR(16)")]:
    try:
        cur.execute(f"ALTER TABLE users ADD COLUMN {col} {typedef}")
        print(f"Columna {col} agregada.")
    except sqlite3.OperationalError:
        print(f"Columna {col} ya existe, se omite.")

conn.commit()
conn.close()
print("Listo.")
