function generateMatrix() {
    const numCities = parseInt(document.getElementById('numCities').value);
    const container = document.getElementById('matrixContainer');
    const originSelect = document.getElementById('origin');
    container.innerHTML = '';
    originSelect.innerHTML = '<option value="">Não definida</option>';

    const table = document.createElement('table');
    table.style.borderCollapse = 'collapse';
    table.style.textAlign = 'center';

    // Cabeçalho da tabela
    const headerRow = document.createElement('tr');
    headerRow.appendChild(document.createElement('th')); // canto vazio
    for(let c = 0; c < numCities; c++){
        const th = document.createElement('th');
        th.innerText = `Destino ${c + 1}`;
        th.style.border = '1px solid black';
        th.style.padding = '5px';
        headerRow.appendChild(th);
    }
    table.appendChild(headerRow);

    for (let i = 0; i < numCities; i++) {
        const row = document.createElement('tr');

        // Cabeçalho da linha
        const th = document.createElement('th');
        th.innerText = `Destino ${i + 1}`;
        th.style.border = '1px solid black';
        th.style.padding = '5px';
        row.appendChild(th);

        for (let j = 0; j < numCities; j++) {
            const input = document.createElement('input');
            input.type = 'number';
            input.min = 0;
            input.value = i === j ? 0 : '';
            input.id = `cell-${i}-${j}`;
            input.style.width = '50px';
            input.style.textAlign = 'center';
            input.style.border = '1px solid black';
            input.style.padding = '2px';

            const td = document.createElement('td');
            td.appendChild(input);
            td.style.border = '1px solid black';
            row.appendChild(td);
        }
        table.appendChild(row);

        // Preencher select origem
        const option = document.createElement('option');
        option.value = i;
        option.text = `Destino ${i + 1}`;
        originSelect.appendChild(option);
    }
    container.appendChild(table);
}

function solveTSP() {
    const numCities = parseInt(document.getElementById('numCities').value);
    const originInput = document.getElementById('origin').value;
    const origin = originInput === '' ? null : parseInt(originInput);
    const costMatrix = [];

    for (let i = 0; i < numCities; i++) {
        const row = [];
        for (let j = 0; j < numCities; j++) {
            const value = parseFloat(document.getElementById(`cell-${i}-${j}`).value);
            row.push(isNaN(value) ? Infinity : value);
        }
        costMatrix.push(row);
    }

    fetch('/solve_tsp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cost_matrix: costMatrix, origin: origin })
    })
    .then(response => response.json())
    .then(data => {
        const resultDiv = document.getElementById('result');
        let html = `<h2>Resultado Final</h2>`;
        html += `<p><strong>Melhor Rota:</strong> ${data.rota_final.join(' → ')}</p>`;
        html += `<p><strong>Custo Final:</strong> ${data.custo_final}</p>`;
        html += `<h3>Etapas Aplicadas:</h3>`;
        data.etapas.forEach(etapa => {
            html += `<p><strong>${etapa.etapa || 'Etapa'}:</strong> ${etapa.rota ? etapa.rota.join(' → ') : ''} — Custo: ${etapa.custo || ''}`;
            if(etapa.descricao){
                html += ` <em>(${etapa.descricao})</em>`;
            }
            html += `</p>`;
        });
        resultDiv.innerHTML = html;
    });
}
