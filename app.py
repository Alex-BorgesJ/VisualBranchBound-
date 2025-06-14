from flask import Flask, render_template, request, jsonify
from tsp_solver import solve_tsp
import os
import json
import webbrowser
from threading import Timer

app = Flask(__name__)
GRAFOS_DIR = 'grafos'
os.makedirs(GRAFOS_DIR, exist_ok=True)

def open_browser():
    webbrowser.open('http://localhost:5000')

@app.route('/')
def home():
    return render_template('home.html')

@app.route('/branch-bound')
def branch_bound():
    return render_template('index.html')

@app.route('/tsp')
def tsp():
    return render_template('tsp.html')

@app.route('/salvar_json', methods=['POST'])
def salvar_json():
    data = request.json
    nome = data['nome']
    grafo = data['grafo']
    
    if not os.path.exists(GRAFOS_DIR):
        os.makedirs(GRAFOS_DIR)
    
    with open(os.path.join(GRAFOS_DIR, f'{nome}.json'), 'w') as f:
        json.dump(grafo, f)
    
    return jsonify({'ok': True})

@app.route('/listar_grafos')
def listar_grafos():
    if not os.path.exists(GRAFOS_DIR):
        return jsonify([])
    
    arquivos = os.listdir(GRAFOS_DIR)
    return jsonify([f.replace('.json', '') for f in arquivos if f.endswith('.json')])

@app.route('/carregar_json/<nome>')
def carregar_json(nome):
    caminho = os.path.join(GRAFOS_DIR, f'{nome}.json')
    if not os.path.exists(caminho):
        return jsonify({"ok": False, "msg": "Arquivo não encontrado."}), 404

    with open(caminho) as f:
        data = json.load(f)
    return jsonify(data)

@app.route('/solve_tsp', methods=['POST'])
def solve_tsp_route():
    data = request.get_json()
    cost_matrix = data.get('cost_matrix')
    origin = data.get('origin')
    from tsp_solver import solve_tsp, convert_numpy
    result = solve_tsp(cost_matrix, origin)
    return jsonify(convert_numpy(result))  # convertendo antes de retornar

if __name__ == '__main__':
    Timer(1.5, open_browser).start()
    app.run(debug=False, use_reloader=False)
