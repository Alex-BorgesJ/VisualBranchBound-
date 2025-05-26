# app.py
from flask import Flask, render_template, request, jsonify
import os
import sqlite3
from threading import Timer

app = Flask(__name__)

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

init_db()

@app.route('/')
def index():
    with sqlite3.connect(DB_FILE) as conn:
        c = conn.cursor()
        c.execute('SELECT DISTINCT grafo FROM nos')
        grafos = [row[0] for row in c.fetchall()]
    return render_template('index.html', grafos=grafos)

@app.route('/criar_grafo', methods=['POST'])
def criar_grafo():
    data = request.get_json()
    nome = data['nome']
    num_vars = int(data['num_vars'])

    with sqlite3.connect(DB_FILE) as conn:
        c = conn.cursor()
        c.execute('INSERT OR IGNORE INTO nos (grafo, id, z, pai, status) VALUES (?, ?, ?, ?, ?)',
                  (nome, '1', None, '0', 'inicial'))

        for i in range(num_vars):
            c.execute('INSERT INTO variaveis (grafo, no_id, nome, valor) VALUES (?, ?, ?, ?)',
                      (nome, '1', f'x{i+1}', None))

        conn.commit()

    return jsonify({"ok": True})

@app.route('/salvar_no', methods=['POST'])
def salvar_no():
    data = request.get_json()
    grafo = data['grafo']
    no_id = data['id']
    z = data['z']
    vars_ = data['vars']
    pai = data['pai']
    status = data['status']

    filhos = []
    with sqlite3.connect(DB_FILE) as conn:
        c = conn.cursor()
        # Atualiza ou insere o nó
        c.execute('''
            INSERT OR REPLACE INTO nos (grafo, id, z, pai, status)
            VALUES (?, ?, ?, ?, ?)
        ''', (grafo, no_id, z, pai, status))

        # Remove variáveis anteriores do nó
        c.execute('DELETE FROM variaveis WHERE grafo = ? AND no_id = ?', (grafo, no_id))

        for i, v in enumerate(vars_):
            c.execute('INSERT INTO variaveis (grafo, no_id, nome, valor) VALUES (?, ?, ?, ?)',
                      (grafo, no_id, f'x{i+1}', v))

            # Gerar filhos se a variável for fracionária
            try:
                val_f = float(v)
                if val_f % 1 != 0:
                    menor = int(val_f)
                    maior = menor + 1
                    id_esq = f"{int(no_id)*2}"
                    id_dir = f"{int(no_id)*2+1}"
                    filhos.append((id_esq, no_id, 'inconclusivo', f'x{i+1}', f'≤{menor}'))
                    filhos.append((id_dir, no_id, 'inconclusivo', f'x{i+1}', f'≥{maior}'))
            except:
                pass

        for f_id, f_pai, f_status, var_nome, var_val in filhos:
            c.execute('INSERT OR REPLACE INTO nos (grafo, id, z, pai, status) VALUES (?, ?, ?, ?, ?)',
                      (grafo, f_id, None, f_pai, f_status))
            c.execute('INSERT INTO variaveis (grafo, no_id, nome, valor) VALUES (?, ?, ?, ?)',
                      (grafo, f_id, var_nome, var_val))

        conn.commit()

    return jsonify({"ok": True})

@app.route('/carregar_grafo/<nome>')
def carregar_grafo(nome):
    nodes = []

    with sqlite3.connect(DB_FILE) as conn:
        c = conn.cursor()
        c.execute('SELECT * FROM nos WHERE grafo = ?', (nome,))
        nos = c.fetchall()

        for no in nos:
            no_id = no[1]
            z = no[2]
            pai = no[3]
            status = no[4]

            c.execute('SELECT nome, valor FROM variaveis WHERE grafo = ? AND no_id = ? ORDER BY nome',
                      (nome, no_id))
            vars_ = [v[1] for v in c.fetchall()]

            nodes.append({
                'id': no_id,
                'z': z,
                'pai': pai,
                'status': status,
                'vars': vars_
            })

    return jsonify(nodes)

if __name__ == '__main__':
    import webbrowser

    def open_browser():
        webbrowser.open_new("http://localhost:5000")

    # Abre o navegador só uma vez, mesmo com debug
    Timer(1, open_browser).start()
    app.run(debug=False)
