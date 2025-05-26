# database.py
import sqlite3

DB_FILE = 'grafos.db'

def init_db():
    with sqlite3.connect(DB_FILE) as conn:
        c = conn.cursor()
        c.execute('''
            CREATE TABLE IF NOT EXISTS nos (
                grafo TEXT,
                id TEXT,
                z REAL,
                pai TEXT,
                status TEXT,
                PRIMARY KEY (grafo, id)
            )
        ''')
        c.execute('''
            CREATE TABLE IF NOT EXISTS variaveis (
                grafo TEXT,
                no_id TEXT,
                nome TEXT,
                valor TEXT,
                FOREIGN KEY (grafo, no_id) REFERENCES nos (grafo, id)
            )
        ''')
        conn.commit()