# app.py
from flask import Flask, render_template, request, jsonify
import os
import csv

app = Flask(__name__)
GRAFOS_DIR = 'grafos'
os.makedirs(GRAFOS_DIR, exist_ok=True)

@app.route('/')
def index():
    arquivos = [f[:-4] for f in os.listdir(GRAFOS_DIR) if f.endswith('.csv')]
    return render_template('index.html', grafos=arquivos)

@app.route('/criar_grafo', methods=['POST'])
def criar_grafo():
    data = request.get_json()
    nome = data['nome']
    num_vars = int(data['num_vars'])
    path = os.path.join(GRAFOS_DIR, f'{nome}.csv')
    with open(path, 'w', newline='') as f:
        writer = csv.writer(f)
        writer.writerow(['id', 'z'] + [f'x{i+1}' for i in range(num_vars)] + ['pai', 'status'])
        writer.writerow(['1', '', *['' for _ in range(num_vars)], '0', 'inicial'])
    return jsonify({"ok": True})

@app.route('/salvar_no', methods=['POST'])
def salvar_no():
    data = request.get_json()
    grafo = data['grafo']
    path = os.path.join(GRAFOS_DIR, f'{grafo}.csv')

    with open(path, 'a', newline='') as f:
        writer = csv.writer(f)
        writer.writerow([data['id'], data['z'], *data['vars'], data['pai'], data['status']])

    filhos = []
    for i, val in enumerate(data['vars']):
        try:
            val_f = float(val)
            if val_f % 1 != 0:
                menor = int(val_f)
                maior = menor + 1
                id_esq = str(int(data['id']) * 2)
                id_dir = str(int(data['id']) * 2 + 1)
                vars_esq = [f'x{i+1}<={menor}']
                vars_dir = [f'x{i+1}>={maior}']
                filhos.append([id_esq, '', *vars_esq, data['id'], 'inconclusivo'])
                filhos.append([id_dir, '', *vars_dir, data['id'], 'inconclusivo'])
        except ValueError:
            continue

    with open(path, 'a', newline='') as f:
        writer = csv.writer(f)
        for filho in filhos:
            writer.writerow(filho)

    return jsonify({"ok": True})

@app.route('/carregar_grafo/<nome>')
def carregar_grafo(nome):
    path = os.path.join(GRAFOS_DIR, f'{nome}.csv')
    nodes = []
    if os.path.exists(path):
        with open(path, newline='') as f:
            reader = csv.DictReader(f)
            for row in reader:
                nodes.append(row)
    return jsonify(nodes)

if __name__ == '__main__':
    import webbrowser
    webbrowser.open("http://localhost:5000")
    app.run(debug=True)
