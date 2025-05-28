let network, nodes, edges;
let idCounter = 1;
let grafo = {};
let numVars = 2;
let varsPrefix = "x";
let nodeSelecionado = null;

function iniciarGrafo() {
    numVars = parseInt(document.getElementById("num_vars").value);
    idCounter = 1;
    grafo = {};
    nodes = new vis.DataSet();
    edges = new vis.DataSet();

    adicionarNo("1", null, "", Array(numVars).fill(null), "pendente");

    const container = document.getElementById("graph");
    const data = { nodes: nodes, edges: edges };
    const options = {
        layout: {
            hierarchical: {
                direction: "UD", // <-- Horizontal (Left to Right)
                sortMethod: "directed",
                nodeSpacing: 200,
                levelSeparation: 150,
                treeSpacing: 300
            }
        },
        nodes: {
            shape: "box",
            margin: 10,
        },
        edges: {
            arrows: "to"
        },
        physics: false,
        interaction: {
            zoomView: false,
            dragView: true, // <-- Habilita pan com mouse
            dragNodes: false,
            navigationButtons: true
        }
    };


    network = new vis.Network(container, data, options);

    network.on("click", function (params) {
        if (params.nodes.length > 0) {
            nodeSelecionado = params.nodes[0];
            abrirModal(nodeSelecionado);
        }
    });
}

function adicionarNo(id, pai, z, vars, status) {
    let label = `Z: ${z || "?"}`;
    vars.forEach((v, i) => {
        label += `\n${varsPrefix + (i + 1)}=${v !== null ? v : "?"}`;
    });
    label += `\n(${status})`;

    const level = pai ? grafo[pai].level + 1 : 0;

    // Cores por tipo de nó
    let color = "#FFFFFF";
    if (status === "podado") color = "#CCCCCC";
    else if (status === "upper") color = "#87CEEB";   // azul claro
    else if (status === "lower") color = "#FF6347";   // vermelho
    else {
        const isInteiro = vars.every(v => typeof v === "number" && Number.isInteger(v));
        color = isInteiro ? "#ADD8E6" : "#FF7F7F";
    }

    // Estilo de borda
    let borderWidth = 1;
    let borderDashes = false;
    if (status === "upper") {
        borderWidth = 4;
        borderDashes = [5, 0]; // Simula borda horizontal dupla
    } else if (status === "lower") {
        borderWidth = 4;
        borderDashes = [0, 5]; // Simula borda vertical dupla
    }

    nodes.add({
        id: id,
        label: label,
        color: {
            background: color,
            border: "#000000"
        },
        font: {
            size: 18,
            color: "#000000",
            multi: true,
            strikethrough: status === "podado"
        },
        borderWidth: borderWidth,
        borderWidthSelected: 3,
        shapeProperties: {
            borderDashes: borderDashes
        },
        level: level
    });

    grafo[id] = { id, pai, z, vars, status, level };

    if (pai) {
        edges.add({ from: pai, to: id, color: { color: "#ffffff" } });
    }
}

function abrirModal(id) {
    const no = grafo[id];
    document.getElementById("z_input").value = no.z || "";

    const varsDiv = document.getElementById("vars_inputs");
    varsDiv.innerHTML = "";

    for (let i = 0; i < numVars; i++) {
        const input = document.createElement("input");
        input.type = "number";
        input.step = "any";
        input.placeholder = `${varsPrefix}${i + 1}`;
        input.id = `var_${i}`;
        if (typeof no.vars[i] === "number") {
            input.value = no.vars[i];
        } else {
            input.value = "";
        }
        varsDiv.appendChild(input);
        varsDiv.appendChild(document.createElement("br"));
    }

    document.getElementById("modal").style.display = "block";
}

function fecharModal() {
    document.getElementById("modal").style.display = "none";
    nodeSelecionado = null;
}

function salvarNo() {
    const id = nodeSelecionado;
    const no = grafo[id];
    const z = parseFloat(document.getElementById("z_input").value);
    const vars = [];

    for (let i = 0; i < numVars; i++) {
        const val = parseFloat(document.getElementById(`var_${i}`).value);
        vars.push(val);
    }

    grafo[id].z = z;
    grafo[id].vars = vars;
    grafo[id].status = "analisado";

    nodes.update({
        id,
        label: gerarLabel(id, z, vars, "analisado"),
        font: { strikethrough: false }
    });

    // Gerar filhos para variáveis fracionárias
    for (let i = 0; i < vars.length; i++) {
        if (!Number.isInteger(vars[i])) {
            const floor = Math.floor(vars[i]);
            const ceil = Math.ceil(vars[i]);

            const idEsq = `${id}.${i}0`;
            const idDir = `${id}.${i}1`;

            const varsEsq = [...vars];
            const varsDir = [...vars];

            varsEsq[i] = `≤${floor}`;
            varsDir[i] = `≥${ceil}`;

            adicionarNo(idEsq, id, "", varsEsq, "lower");
            adicionarNo(idDir, id, "", varsDir, "upper");
        }
    }

    fecharModal();
}

function podar() {
    const id = nodeSelecionado;
    const no = grafo[id];
    grafo[id].status = "podado";
    nodes.update({
        id,
        label: gerarLabel(id, no.z, no.vars, "podado"),
        font: { strikethrough: true }
    });
    // Remove filhos do nó podado
    edges.get().forEach(edge => {
        if (edge.from === id) {
            const childId = edge.to;
            nodes.remove({ id: childId });
            delete grafo[childId];
            edges.remove({ id: edge.id });
        }
    });
    fecharModal();
}

function gerarLabel(id, z, vars, status) {
    let label = `Z: ${z || "?"}`;
    vars.forEach((v, i) => {
        label += `\n${varsPrefix + (i + 1)}=${v !== null ? v : "?"}`;
    });
    return label + `\n(${status})`;
}

document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") {
        fecharModal();
    }
});