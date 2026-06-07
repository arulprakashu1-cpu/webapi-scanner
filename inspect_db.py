import sqlite3

conn = sqlite3.connect('d:/cl API/webapi-scanner/backend/scanner.db')
cursor = conn.cursor()

cursor.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
tables = [row[0] for row in cursor.fetchall()]
print(f'=== Tables Found: {len(tables)} ===\n')

for t in tables:
    cursor.execute(f'PRAGMA table_info("{t}")')
    cols = cursor.fetchall()
    cursor.execute(f'SELECT COUNT(*) FROM "{t}"')
    count = cursor.fetchone()[0]
    print(f'[{t}] -- {count} rows')
    for c in cols:
        line = f'  {c[0]}. {c[1]} ({c[2]})'
        if c[5]: line += ' PK'
        if c[3]: line += ' NOT NULL'
        if c[4] is not None: line += f' DEFAULT {c[4]}'
        print(line)
    print()

conn.close()
