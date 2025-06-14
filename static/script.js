let network, nodes, edges;
let idCounter = 1;
let grafo = {};
let numVars = 2;
let varsPrefix = "x";
let nodeSelecionado = null;
let automaticChildren = true;

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
                direction: "UD",
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
            arrows: "to",
            color: { color: "#ffffff" }
        },
        physics: false,
        interaction: {
            zoomView: false,
            dragView: true,
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

    let color = "#FFFFFF";
    if (status === "podado") color = "#CCCCCC";
    else if (status === "upper") color = "#87CEEB";
    else if (status === "lower") color = "#FF6347";
    else {
        const isInteiro = vars.every(v => typeof v === "number" && Number.isInteger(v));
        color = isInteiro ? "#ADD8E6" : "#FF7F7F";
    }

    let borderWidth = 1;
    let borderDashes = false;
    if (status === "upper") {
        borderWidth = 4;
        borderDashes = [5, 0];
    } else if (status === "lower") {
        borderWidth = 4;
        borderDashes = [0, 5];
    }

    nodes.add({
        id,
        label,
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
        borderWidth,
        borderWidthSelected: 3,
        shapeProperties: {
            borderDashes
        },
        level
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
        input.value = typeof no.vars[i] === "number" ? no.vars[i] : "";

        varsDiv.appendChild(input);

        // Botão para gerar filhos manualmente
        const btn = document.createElement("button");
        btn.innerHTML = `<i class="fas fa-code-branch"></i>`;
        btn.title = `Fragmentar por ${varsPrefix}${i + 1}`; // dica ao passar o mouse
        btn.onclick = function () {
            gerarFilhosParaVariavel(id, i);
            fecharModal(); // opcional: fecha modal após gerar
        };
        varsDiv.appendChild(btn);

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

    if (automaticChildren) {
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

function exportarGrafo(nome = "meu_grafo") {
    const payload = {
        nome: nome,
        grafo: {
            numVars: numVars,
            nodes: grafo,
            idCounter: idCounter
        }
    };

    fetch('/salvar_json', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    })
        .then(res => res.json())
        .then(data => {
            if (data.ok) alert("✅ Grafo salvo!");
            else alert("❌ Erro ao salvar.");
        });
}

function carregarGrafo(nome) {
    fetch(`/carregar_json/${nome}`)
        .then(res => res.json())
        .then(data => {
            numVars = data.numVars;
            grafo = data.nodes;
            idCounter = data.idCounter;

            nodes = new vis.DataSet();
            edges = new vis.DataSet();

            for (const id in grafo) {
                const no = grafo[id];
                adicionarNo(no.id, no.pai, no.z, no.vars, no.status);
            }

            const container = document.getElementById("graph");
            const dataVis = { nodes: nodes, edges: edges };
            const options = {
                layout: {
                    hierarchical: {
                        direction: "UD",
                        sortMethod: "directed",
                        nodeSpacing: 200,
                        levelSeparation: 150,
                        treeSpacing: 300
                    }
                },
                nodes: { shape: "box", margin: 10 },
                edges: { arrows: "to", color: { color: "#ffffff" } },
                physics: false,
                interaction: {
                    zoomView: false,
                    dragView: true,
                    dragNodes: false,
                    navigationButtons: true
                }
            };

            network = new vis.Network(container, dataVis, options);
            network.on("click", function (params) {
                if (params.nodes.length > 0) {
                    nodeSelecionado = params.nodes[0];
                    abrirModal(nodeSelecionado);
                }
            });
        });
}

function abrirSalvarModal() {
    document.getElementById("nomeSalvar").value = "";
    document.getElementById("msgSalvar").innerText = "";
    document.getElementById("modalSalvar").style.display = "block";
}

function fecharModalSalvar() {
    document.getElementById("modalSalvar").style.display = "none";
}

function salvarGrafo() {
    const nome = document.getElementById("nomeSalvar").value.trim();
    const msg = document.getElementById("msgSalvar");

    if (!nome) {
        msg.innerText = "⚠️ Informe um nome para salvar o grafo.";
        return;
    }

    fetch(`/listar_grafos`)
        .then(res => res.json())
        .then(lista => {
            if (lista.includes(nome)) {
                msg.innerText = "⚠️ Já existe um grafo com esse nome.";
            } else {
                const payload = {
                    nome: nome,
                    grafo: {
                        numVars: numVars,
                        nodes: grafo,
                        idCounter: idCounter
                    }
                };

                fetch('/salvar_json', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                })
                    .then(res => res.json())
                    .then(data => {
                        if (data.ok) {
                            msg.style.color = "#8f8";
                            msg.innerText = "✅ Grafo salvo com sucesso!";
                            setTimeout(() => fecharModalSalvar(), 1000);
                        } else {
                            msg.innerText = "❌ Erro ao salvar grafo.";
                        }
                    });
            }
        });
}

function abrirCarregarModal() {
    const select = document.getElementById("selectGrafo");
    select.innerHTML = "";
    fetch(`/listar_grafos`)
        .then(res => res.json())
        .then(lista => {
            if (lista.length === 0) {
                const option = document.createElement("option");
                option.text = "Nenhum grafo salvo";
                select.add(option);
            } else {
                lista.forEach(nome => {
                    const option = document.createElement("option");
                    option.value = nome;
                    option.text = nome;
                    select.appendChild(option);
                });
            }
            document.getElementById("modalCarregar").style.display = "block";
        });
}

function fecharModalCarregar() {
    document.getElementById("modalCarregar").style.display = "none";
}

function confirmarCarregamento() {
    const nome = document.getElementById("selectGrafo").value;
    if (nome && nome !== "Nenhum grafo salvo") {
        carregarGrafo(nome);
        fecharModalCarregar();
    }
}

function alternarGeracaoAutomatica() {
    automaticChildren = !automaticChildren;
    const btn = document.getElementById("btnToggleGeracao");
    btn.innerHTML = `<i class="fas fa-robot"></i> Geração Automática: ${automaticChildren ? 'ON' : 'OFF'}`;
}

function gerarFilhosParaVariavel(id, i) {
    const no = grafo[id];
    const val = no.vars[i];
    const floor = Math.floor(parseFloat(val));
    const ceil = Math.ceil(parseFloat(val));

    const idEsq = `${id}.${i}0`;
    const idDir = `${id}.${i}1`;

    const varsEsq = [...no.vars];
    const varsDir = [...no.vars];

    varsEsq[i] = `≤${floor}`;
    varsDir[i] = `≥${ceil}`;

    adicionarNo(idEsq, id, "", varsEsq, "lower");
    adicionarNo(idDir, id, "", varsDir, "upper");
}