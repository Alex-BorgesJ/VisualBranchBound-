import numpy as np
import json
from flask import Flask, request, jsonify

app = Flask(__name__)

def greedy_nearest_neighbor(cost_matrix, origin):
    n = len(cost_matrix)
    unvisited = set(range(n))
    path = [origin]
    unvisited.remove(origin)

    while unvisited:
        last = path[-1]
        next_city = min(unvisited, key=lambda city: cost_matrix[last][city])
        path.append(next_city)
        unvisited.remove(next_city)

    path.append(origin)
    total_cost = sum(cost_matrix[path[i]][path[i + 1]] for i in range(len(path) - 1))
    return path, total_cost

def convert_numpy(obj):
    if isinstance(obj, np.ndarray):
        return obj.tolist()
    elif isinstance(obj, (np.float32, np.float64)):
        return float(obj)
    elif isinstance(obj, (np.int32, np.int64)):
        return int(obj)
    elif isinstance(obj, dict):
        return {k: convert_numpy(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [convert_numpy(i) for i in obj]
    else:
        return obj

def calc_cost(cost_matrix, path):
    return sum(cost_matrix[path[i]][path[i + 1]] for i in range(len(path) - 1))

def k_opt(cost_matrix, path, k):
    n = len(path)
    fixed_start = path[0]
    fixed_end = path[-1]
    middle = path[1:-1]

    etapas = []
    best_paths = [(path[:], calc_cost(cost_matrix, path))]

    for i in range(0, len(middle) - k + 1):
        sub = middle[i:i+k]
        reversed_sub = sub[::-1]
        new_middle = middle[:i] + reversed_sub + middle[i+k:]
        new_path = [fixed_start] + new_middle + [fixed_end]
        new_cost = calc_cost(cost_matrix, new_path)

        etapas.append({
            "etapa": f"Reversao {k} por vez na posição {i+1} até {i+k}",
            "rota": new_path[:],
            "custo": float(new_cost)
        })

        best_paths.append((new_path, new_cost))

    min_cost = min(c for _, c in best_paths)
    best_final_paths = [(p, c) for p, c in best_paths if c == min_cost]
    return best_final_paths, etapas

def solve_tsp(cost_matrix, origin_name=None):
    n = len(cost_matrix)
    cost_matrix = np.array(cost_matrix)
    destino_labels = [f"Destino {i + 1}" for i in range(n)]
    etapas = []

    if origin_name is not None:
        try:
            origin = int(origin_name)
            if origin < 0 or origin >= n:
                raise ValueError
        except:
            raise ValueError("Origem inválida")
    else:
        origin = None

    melhores_rotas = []
    if origin is None:
        for i in range(n):
            rota, custo = greedy_nearest_neighbor(cost_matrix, i)
            etapas.append({
                "etapa": f"Vizinho mais próximo - origem {destino_labels[i]}",
                "rota": [destino_labels[r] for r in rota],
                "custo": float(custo)
            })
            melhores_rotas.append((rota, custo))
        min_cost = min(c for _, c in melhores_rotas)
        melhores_rotas = [(r, c) for r, c in melhores_rotas if c == min_cost]
    else:
        rota, custo = greedy_nearest_neighbor(cost_matrix, origin)
        etapas.append({
            "etapa": f"Vizinho mais próximo",
            "rota": [destino_labels[r] for r in rota],
            "custo": float(custo)
        })
        melhores_rotas = [(rota, custo)]

    for k in range(2, n):  # de 2-opt até (n-1)-opt
        novas_rotas = []
        for rota_base, _ in melhores_rotas:
            melhores_kopt, etapas_k = k_opt(cost_matrix, rota_base, k)
            novas_rotas.extend(melhores_kopt)
            for etapa in etapas_k:
                etapa["rota"] = [destino_labels[i] for i in etapa["rota"]]
                etapas.append(etapa)

        min_cost = min(c for _, c in novas_rotas)
        melhores_rotas = [(r, c) for r, c in novas_rotas if c == min_cost]

    melhor_rota, melhor_custo = melhores_rotas[0]

    resultado = {
        "rota_final": [destino_labels[r] for r in melhor_rota],
        "custo_final": float(melhor_custo),
        "etapas": etapas
    }

    with open('tsp_result.json', 'w') as f:
        json.dump(resultado, f, indent=2)

    return resultado

@app.route('/solve_tsp', methods=['POST'])
def solve_tsp_route():
    data = request.get_json()
    cost_matrix = data.get('cost_matrix')
    origin_name = data.get('origin')
    resultado = solve_tsp(cost_matrix, origin_name)
    return jsonify(resultado)

if __name__ == '__main__':
    app.run(debug=True)
