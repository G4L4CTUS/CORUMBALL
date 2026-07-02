let abertos = JSON.parse(localStorage.getItem('abertos') || '[]');

socket = io();
socket.on('printerUpdate', function(data) {
    window.ultimosDadosImpressora = data;
    renderImpressoras(data);
});

function renderImpressoras(data) {
    const grupos = data.reduce(function(acc, impressora) {
        const unidade = impressora.unit || 'GERAL';
        if (!acc[unidade]) {
            acc[unidade] = { items: [], err: false };
        }
        acc[unidade].items.push(impressora);
        if (impressora.hasError) {
            acc[unidade].err = true;
        }
        return acc;
    }, {});

    const nomesDosGrupos = Object.keys(grupos).sort();

    document.getElementById('arvore').innerHTML = nomesDosGrupos.map(function(nomeUnidade) {
        const grupo = grupos[nomeUnidade];
        const estaAberto = abertos.includes(nomeUnidade);
        const temErro = grupo.err;
        const quantidadeItens = grupo.items.length;
        const sufixoDispositivo = quantidadeItens !== 1 ? 'S' : '';
        const iconeArrow = estaAberto ? '▲' : '▼';
        const iconeFolder = estaAberto ? '📂' : '📁';
        const bordaErro = temErro ? 'border: 1px solid rgba(239, 68, 68, 0.4);' : 'border: 1px solid rgba(30, 41, 59, 0.6);';

        return `
        <div style="border-radius: 1rem; overflow: hidden; ${bordaErro}">
            <div onclick="toggleGrupo('${nomeUnidade}')" style="display: flex; justify-content: space-between; align-items: center; padding: 1.25rem; cursor: pointer; transition: background-color 0.2s; user-select: none;" onmouseover="this.style.backgroundColor='rgba(30,41,59,0.3)'" onmouseout="this.style.backgroundColor='transparent'">
                <div style="display: flex; align-items: center; gap: 1rem;">
                    <span style="font-size: 1.5rem;">${estaAberto ? '📂' : '📁'}</span>
                    <div>
                        <h2 style="font-size: 1.25rem; font-weight: 700; color: #60a5fa; text-transform: uppercase; letter-spacing: -0.025em;">${nomeUnidade}</h2>
                        <p style="font-size: 0.625rem; color: #64748b; font-family: monospace;">${quantidadeItens} DISPOSITIVO${sufixoDispositivo}</p>
                    </div>
                </div>
                <span id="seta-${nomeUnidade}" style="color: #475569; font-size: 0.875rem;">${estaAberto ? '▲' : '▼'}</span>
            </div>

            <div id="grupo-${nomeUnidade}" style="display: ${estaAberto ? 'block' : 'none'}; border-top: 1px solid rgba(30, 41, 59, 0.4); background-color: rgba(0,0,0,0.1);">
                <div style="padding: 1.5rem; display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1.5rem;">
                    ${grupo.items.map(function(imp) { return cardImpressora(imp); }).join('')}
                </div>
            </div>
        </div>`;
    }).join('');
}

function toggleGrupo(nomeUnidade) {
    const listaInterna = document.getElementById('grupo-'+ nomeUnidade);
    const seta = document.getElementById('seta-' + nomeUnidade)
    if(!listaInterna) return;
    if (listaInterna.style.display === 'none') {
        listaInterna.style.display = 'block';
        seta.innerText = '▲';
        if (!abertos.includes(nomeUnidade)) abertos.push(nomeUnidade);
    } else {
        listaInterna.style.display = 'none'; 
        seta.innerText = '▼';
        abertos = abertos.filter(n => n !== nomeUnidade);
    }
    localStorage.setItem('abertos', JSON.stringify(abertos));
}

function cardImpressora(impressora) {
    if (impressora.model.toUpperCase().includes("I9") || impressora.model.toUpperCase().includes("ZD230")) {
        const corCardTermica = impressora.hasError ? 'border: 1px solid rgba(239, 68, 68, 0.6);' : 'border: 1px solid rgba(30, 41, 59, 0.6);';
        const statusTexto = impressora.status === 'offline' ? 'offline' : (impressora.hasError ? 'alerta' : 'online');
        const corIndicadorTermica = impressora.status === 'offline' ? '#dc2626' : (impressora.hasError ? '#f97316' : '#10b981');
        const alertaOffline = impressora.status === 'offline' ? '<div style="background-color: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.2); color: #f87171; font-size: 0.625rem; font-weight: 700; padding: 0.625rem; border-radius: 0.75rem; margin-bottom: 1rem; text-transform: uppercase; letter-spacing: 0.05em;">⚠️ OFFLINE</div>' : '';

        return `
        <div style="background-color: #0d1117; padding: 1.25rem; border-radius: 1rem; ${corCardTermica} position: relative; transition: border-color 0.2s;" class="card-impressora">
            <button onclick="event.stopPropagation(); deletarImpressora(${impressora.id})" class="btn-deletar" style="position: absolute; top: 1rem; right: 40px; color: #334155; font-size: 1.125rem; background: none; border: none; cursor: pointer; opacity: 0; transition: opacity 0.2s, color 0.2s;" onmouseover="this.style.color='#ef4444'" onmouseout="this.style.color='#334155'">🗑️</button>
            
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1rem;">
                <div>
                    <h3 style="font-size: 1.125rem; font-weight: 700; text-transform: uppercase; letter-spacing: -0.025em; max-width: 160px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${impressora.name}</h3>
                    <p style="font-size: 0.75rem; color: #64748b; font-family: monospace;">${impressora.ip}</p>
                    <p style="font-size: 0.625rem; color: #475569; text-transform: uppercase; margin-top: 0.125rem;">📠 ${impressora.model}</p>
                </div>
                <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 0.25rem; margin-top: 0.25rem;">
                    <div style="width: 0.625rem; height: 0.625rem; border-radius: 9999px; background-color: ${corIndicadorTermica};"></div>
                    <span style="font-size: 0.5625rem; color: #475569; text-transform: uppercase;">${statusTexto}</span>
                </div>
            </div>

            ${alertaOffline}

           <div style="background-color: #1e293b; padding: 15px; border-radius: 0.75rem; text-align: center; margin-bottom: 1rem; border: 1px solid rgba(255,255,255,0.02);">
                <p style="font-size: 10px; color: #64748b; font-weight: 700; letter-spacing: 0.05em; margin-bottom: 4px;">STATUS TÉRMICA</p>
                <p style="font-size: 16px; font-weight: 800; color: ${impressora.status === 'offline' || impressora.hasError ? '#ef4444' : '#10b981'}; letter-spacing: -0.025em;"> 
                    ${impressora.status === 'offline' ? 'OFFLINE' : (impressora.statusMsg || (impressora.paper === 'VAZIO' ? 'SEM PAPEL' : 'PRONTA'))}
                </p>
            </div>
        </div>`;
    }

    const coresDeToner = ['#94a3b8', '#22d3ee', '#ec4899', '#facc15'];
    const nomesToner = impressora.isColor ? ['K', 'C', 'M', 'Y'] : ['TONER'];
    const toners = impressora.toners || [];
	const ModeloImpressora = impressora.modeloImpre || 'N/A'
    
    const tonersHTML = toners.map(function(toner, indice) {
        const corFundo = coresDeToner[indice] || '#94a3b8';
        const corLabel = toner.isAlert ? '#ef4444' : '#cbd5e1';
        const animacaoPulse = toner.isAlert ? 'animation: pulse 1s infinite;' : '';
        return '<div style="background-color: rgba(0,0,0,0.2); padding: 0.625rem; border-radius: 0.75rem; border: 1px solid rgba(30,41,59,0.6);">' +
            '<div style="display: flex; justify-content: space-between; font-size: 0.625rem; font-weight: 700; margin-bottom: 0.375rem;">' +
                '<span style="color: #64748b;">' + (impressora.isColor ? nomesToner[indice] : 'TONER') + '</span>' +
                '<span style="color: ' + corLabel + '; ' + animacaoPulse + '">' + toner.label + '</span>' +
            '</div>' +
            '<div style="width: 100%; height: 4px; background-color: #1e293b; border-radius: 9999px; overflow: hidden;">' +
                '<div style="height: 100%; background-color: ' + corFundo + '; width: ' + toner.percent + '%; transition: width 0.5s;"></div>' +
            '</div>' +
        '</div>';
    }).join('');

    const corIndicador = impressora.status === 'offline' ? '#dc2626' : impressora.hasError ? '#f97316' : '#10b981';
    const textoStatus = impressora.status === 'offline' ? 'offline' : impressora.hasError ? 'alerta' : 'online';
    const bordaCard = impressora.hasError ? 'border: 1px solid rgba(239, 68, 68, 0.6);' : 'border: 1px solid rgba(30, 41, 59, 0.6);';
    const colunasGrid = impressora.isColor ? 'grid-template-columns: 1fr 1fr;' : 'grid-template-columns: 1fr;';

    const mensagensDeErro = impressora.errorMessages || ['OFFLINE / VERIFICAR STATUS'];
    
    const alertaHTML = impressora.hasError
        ? '<div style="background-color: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.2); color: #f87171; font-size: 0.625rem; font-weight: 700; padding: 0.625rem; border-radius: 0.75rem; margin-bottom: 1rem; text-transform: uppercase; letter-spacing: 0.05em;">⚠️ ' + mensagensDeErro.join(' · ') + '</div>'
        : '';

    const corPapel = impressora.paper === 'VAZIO' ? '#ef4444' : 'white';
    const textoPapel = impressora.paper === 'VAZIO' ? '⚠ VAZIO' : '✓ OK';

    return '<div style="background-color: #0d1117; padding: 1.25rem; border-radius: 1rem; ' + bordaCard + ' position: relative; transition: border-color 0.2s;" class="card-impressora">' +
        '<button onclick="event.stopPropagation(); deletarImpressora(' + impressora.id + ')" class="btn-deletar" style="position: absolute; top: 1rem; right: 3rem; color: #334155; font-size: 1.125rem; background: none; border: none; cursor: pointer; opacity: 0; transition: opacity 0.2s, color 0.2s;"' +
            ' onmouseover="this.style.color=\'#ef4444\'" onmouseout="this.style.color=\'#334155\'">🗑️</button>' +

        '<div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1rem;">' +
            '<div>' +
                '<h3 style="font-size: 1.125rem; font-weight: 700; text-transform: uppercase; letter-spacing: -0.025em; max-width: 160px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">' + impressora.name + '</h3>' +
                '<p style="font-size: 0.75rem; color: #64748b; font-family: monospace;">' + impressora.ip + '</p>' +
                '<p style="font-size: 0.625rem; color: #475569; text-transform: uppercase; margin-top: 0.125rem;">' + impressora.modeloImpre + '</p>' +
            '</div>' +
            '<div style="display: flex; flex-direction: column; align-items: flex-end; gap: 0.25rem; margin-top: 0.25rem;">' +
                '<div style="width: 0.625rem; height: 0.625rem; border-radius: 9999px; background-color: ' + corIndicador + ';"></div>' +
                '<span style="font-size: 0.5625rem; color: #475569; text-transform: uppercase;">' + textoStatus + '</span>' +
            '</div>' +
        '</div>' +

        alertaHTML +

        '<div style="display: grid; ' + colunasGrid + ' gap: 0.5rem; margin-bottom: 1rem;">' +
            tonersHTML +
        '</div>' +

        '<div style="display: flex; justify-content: space-between; align-items: flex-end; padding-top: 1rem; border-top: 1px solid rgba(30,41,59,0.4);">' +
            '<div>' +
                '<p style="font-size: 0.625rem; color: #64748b; text-transform: uppercase; font-weight: 700; margin-bottom: 0.125rem;">PAPEL</p>' +
                '<p style="font-size: 1rem; font-weight: 700; color: ' + corPapel + ';">' + textoPapel + '</p>' +
            '</div>' +
            '<div style="text-align: right;">' +
                '<p style="font-size: 0.625rem; color: #64748b; text-transform: uppercase; font-weight: 700; margin-bottom: 0.125rem;">TOTAL PÁG.</p>' +
                '<p style="font-size: 1rem; font-weight: 700; color: white; font-family: monospace;">' + (impressora.pageCount || 0).toLocaleString('pt-BR') + '</p>' +
            '</div>' +
        '</div>' +
    '</div>';
}

document.addEventListener('mouseover', function(evento) {
    const card = evento.target.closest('.card-impressora');
    if (card) {
        const btnDeletar = card.querySelector('.btn-deletar');
        if (btnDeletar) btnDeletar.style.opacity = '1';
    }
});

document.addEventListener('mouseout', function(evento) {
    const card = evento.target.closest('.card-impressora');
    if (card && !card.contains(evento.relatedTarget)) {
        const btnDeletar = card.querySelector('.btn-deletar');
        if (btnDeletar) btnDeletar.style.opacity = '0';
    }
});

function abrirModalImpressora() {
    const modal = document.getElementById('modal-impressora');
    if (modal) modal.style.display = 'flex';
}

function fecharModalImpressora() {
    const modal = document.getElementById('modal-impressora');
    if (modal) modal.style.display = 'none';
}

async function salvarImpressora() {
    const unidade = document.getElementById('in-unit').value;
    const setor = document.getElementById('in-name').value;
    const endereco = document.getElementById('in-ip').value;
    const modelo = document.getElementById('in-model').value;

    const corpo = { unit: unidade, name: setor, ip: endereco, model: modelo };

    await fetch('/api/printers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(corpo)
    });
    fecharModalImpressora();

    const camposDoFormulario = ['in-unit', 'in-name', 'in-ip', 'in-model'];
    camposDoFormulario.forEach(function(idCampo) {
        document.getElementById(idCampo).value = '';
    });
}

async function deletarImpressora(idImpressora) {
    const confirmado = confirm('Remover esta impressora?');
    if (!confirmado) return;

    await fetch('/api/printers/' + idImpressora, { method: 'DELETE' });
}