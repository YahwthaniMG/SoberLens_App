# backend/add_emergency_contact_name.py
"""
Migracion: agrega emergency_contact_name a la tabla users.
Ejecutar una vez: python add_emergency_contact_name.py
"""
import sqlite3, os

db_path = os.getenv("DATABASE_URL", "sqlite:///./soberlens.db").replace(
    "sqlite:///", ""
)
conn = sqlite3.connect(db_path)
cur = conn.cursor()

try:
    cur.execute("ALTER TABLE users ADD COLUMN emergency_contact_name VARCHAR(64)")
    print("Columna emergency_contact_name agregada.")
except sqlite3.OperationalError:
    print("Columna ya existe, se omite.")

conn.commit()
conn.close()
print("Listo.")
