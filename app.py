from flask import Flask, render_template, request, jsonify
from tsp_solver import solve_tsp
import os
import json

app = Flask(__name__)
GRAFOS_DIR = 'grafos'
os.makedirs(GRAFOS_DIR, exist_ok=True)

@app.route('/')
def index():
    arquivos = [f[:-5] for f in os.listdir(GRAFOS_DIR) if f.endswith('.json')]
    return render_template('index.html', grafos=arquivos)

@app.route("/salvar_json", methods=["POST"])
def salvar_json():
    data = request.get_json()
    nome = data.get("nome", "").strip()

    if not nome:
        return jsonify({"ok": False, "msg": "Nome inválido."}), 400

    caminho = os.path.join(GRAFOS_DIR, nome + ".json")
    if os.path.exists(caminho):
        return jsonify({"ok": False, "msg": "Já existe um grafo com esse nome."}), 400

    with open(caminho, "w") as f:
        json.dump(data["grafo"], f)
    return jsonify({"ok": True})

@app.route("/carregar_json/<nome>")
def carregar_json(nome):
    caminho = os.path.join(GRAFOS_DIR, nome + ".json")
    if not os.path.exists(caminho):
        return jsonify({"ok": False, "msg": "Arquivo não encontrado."}), 404

    with open(caminho) as f:
        data = json.load(f)
    return jsonify(data)

@app.route("/listar_grafos")
def listar_grafos():
    arquivos = os.listdir(GRAFOS_DIR)
    nomes = [arq.replace(".json", "") for arq in arquivos if arq.endswith(".json")]
    return jsonify(nomes)

@app.route('/tsp')
def tsp():
    return render_template('tsp.html')

@app.route('/solve_tsp', methods=['POST'])
def solve_tsp_route():
    data = request.get_json()
    cost_matrix = data.get('cost_matrix')
    origin = data.get('origin')
    from tsp_solver import solve_tsp, convert_numpy
    result = solve_tsp(cost_matrix, origin)
    return jsonify(convert_numpy(result))  # convertendo antes de retornar


if __name__ == '__main__':
    import webbrowser
    webbrowser.open("http://localhost:5000")
    app.run(debug=True)
