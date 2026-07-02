window.addEventListener('DOMContentLoaded', async () => {
    const resp = await fetch('/api/infra');
    const dados = await resp.json();
    dados.forEach(eq => renderizarEquipamento(eq));
});
window.adicionarEquipamento = async function(tipo) {
    const ip = prompt(`Qual o ip do equipamento: ${tipo.toUpperCase()}?`);
    if(!ip){
        alert(`O ip é necessário para o monitoramente automático das portas.`)
    }
    const nome = prompt(`Nome do ${tipo.toUpperCase()}:`);
    if (!nome) return;
    const portas = parseInt(prompt("Qtd Portas:", tipo === 'rb' ? 5 : 24));
    if (isNaN(portas)) return;
    
    const novoEq = { nome, ip, tipo, portas, dadosPortas: {} };

    const resp = await fetch('/api/infra', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(novoEq)
    });
    
    const salvo = await resp.json();
    renderizarEquipamento(salvo);
};

function renderizarEquipamento(eq) {
    const painel = document.getElementById('painel-infra');
    let portasHTML = '';
    
    for (let i = 1; i <= eq.portas; i++) {
        const infoPorta = eq.dadosPortas?.[i] || { descricao: "Disponível", cor: "#10b981" };
        portasHTML += `
            <div class="porta-fisica" 
                 data-porta="${i}"
                 title="Porta ${i}: ${infoPorta.descricao}" 
                 onclick="window.editarPorta(this, ${eq.id}, ${i})"
                 style="width:25px; height:25px; background:${infoPorta.cor}; border-radius:4px; cursor:pointer; display:flex; align-items:center; justify-content:center; font-size:10px; border:1px solid rgba(0,0,0,0.2);">
                 ${i}
            </div>`;
    }
    

    const card = document.createElement('div');
    card.id = `card-eq-${eq.id}`;
    card.style.cssText = "background: #0d1117; border: 1px solid #1e293b; border-radius: 1rem; padding: 1.25rem; width: fit-content; position: relative;";
    
   card.innerHTML = `
    <button onclick="window.apagarEquipamento(${eq.id})" style="position:absolute; top:10px; right:10px; background:none; border:none; cursor:pointer; opacity:0.5;" onmouseover="this.style.opacity=1" onmouseout="this.style.opacity=0.5">🗑️</button>
    <div style="display:flex; align-items:center; gap:10px; margin-bottom:1rem; color:#60a5fa;">
        <div style="width:8px; height:8px; background:#10b981; border-radius:50%; box-shadow: 0 0 8px #10b981;"></div>
        <strong style="letter-spacing: 0.05em;">${eq.nome.toUpperCase()}</strong>
    </div>
    <div style="background:#1e293b; padding:1.5rem; border-radius:0.75rem; box-shadow: inset 0 2px 4px rgba(0,0,0,0.3);">
        <div style="display: flex; justify-content: center; align-items: center; width: 100%; height: 140px; margin: 1.5rem 0;">
    ${
        eq.tipo === 'rb' 
            ? '<img src="/RB.png" alt="RB" style="max-width: 90%; max-height: 120px; object-fit: contain;">' 
            : eq.tipo === 'switch' 
                ? '<img src="/switch.png" alt="Switch" style="max-width: 90%; max-height: 120px; object-fit: contain;">' 
                : '<img src="/roteador.png" alt="Roteador" style="max-width: 90%; max-height: 160px; object-fit: contain;">'
    }
</div>
			<div style="display: flex; justify-content: center; flex-wrap: wrap; gap: 8px; width: 100%; margin-top: 10px; max-width: 400px ">
				${portasHTML}
			</div>
		
    </div>
    <div style="margin-top: 1rem; padding-top: 0.75rem; border-top: 1px dashed rgba(255,255,255,0.1); display: flex; flex-direction: column; align-items: center; gap: 4px;">
    <div style="display: flex; align-items: center; gap: 6px;">
        <span style="font-size: 9px; color: #475569; text-transform: uppercase; font-weight: 800;">Model:</span>
        <span id="modelo-${eq.id}" style="font-size: 11px; color: #ffffff; font-family: monospace; font-weight: bold;">Buscando...</span>
    </div>
    <div style="display: flex; align-items: center; gap: 6px;">
        <span style="font-size: 9px; color: #475569; text-transform: uppercase; font-weight: 800;">Firmware:</span>
        <span id="versao-${eq.id}" style="font-size: 10px; color: #60a5fa; font-family: monospace;">Buscando...</span>
    </div>
</div>
`;
    painel.appendChild(card);
}

window.editarPorta = async function(el, eqId, portaNum) {
    const novaDesc = prompt("Descrição da porta (vazio para liberar):", el.title.split(': ')[1]);
    if (novaDesc === null) return;

    const cor = novaDesc.trim() === "" ? "#10b981" : "#ef4444";
    const descricao = novaDesc.trim() === "" ? "Disponível" : novaDesc;

    el.style.background = cor;
    el.title = `Porta ${portaNum}: ${descricao}`;

    await fetch('/api/infra/porta', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eqId, portaNum, descricao, cor })
    });
};
window.apagarEquipamento = async function(id) {
    if (!confirm("Deseja remover este equipamento da Corumba T.I.?")) return;

    const resp = await fetch(`/api/infra/${id}`, { method: 'DELETE' });
    if (resp.ok) {
        document.getElementById(`card-eq-${id}`).remove();
    }
};
socket.on('infraStatusUpdate', (dados) => {
    const { eqId, statusPortas, versao, modelo } = dados;
    const txtVersao = document.getElementById(`versao-${eqId}`);
    const txtModelo = document.getElementById(`modelo-${eqId}`);
    if (txtVersao && versao) txtVersao.innerText = `OS: ${versao}`;
    if (txtModelo && modelo) txtModelo.innerText = modelo;
    for (const [portaNum, info] of Object.entries(statusPortas)) {
        const elPorta = document.querySelector(`#card-eq-${eqId} [data-porta="${portaNum}"]`);
        if (elPorta) {
            elPorta.style.background = info.cor;
            elPorta.title = `Porta ${portaNum}: ${info.descricao} (via SNMP)`;
        }
    }
});

