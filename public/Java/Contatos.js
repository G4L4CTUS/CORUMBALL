document.addEventListener('DOMContentLoaded', carregarContatosDaAPI);

async function carregarContatosDaAPI() {
    try {
        const res = await fetch('/api/contatos');
        const contatos = await res.json();

        let optionsHTML = '<option value="">🔕 Não notificar ninguém</option>';
        
        contatos.forEach(c => {

            optionsHTML += `<option value="${c.numero}">📱 ${c.nome}</option>`;
        });
        
        const selectRecado = document.getElementById('wpp-recado');
        const selectAtd = document.getElementById('wpp-atendimento');
        
        if (selectRecado) selectRecado.innerHTML = optionsHTML;
        if (selectAtd) selectAtd.innerHTML = optionsHTML;
   
        renderizarListaDoGerenciamento(contatos);
    } catch (erro) {
        console.error("Erro ao carregar contatos:", erro);
    }
}

function abrirModalContatos() {
    const modal = document.getElementById('modal-contatos');
    if (modal) modal.style.display = 'flex';
}

// 3. CORREÇÃO: Arrumado o nome para fecharModalContatos
function fecharModalContatos() {
    const modal = document.getElementById('modal-contatos');
    if (modal) modal.style.display = 'none';
}

async function salvarContato() {
   
    const nome = document.getElementById('novo-ctt-nome').value;
    const numero = document.getElementById('novo-ctt-num').value;
    
    if(!nome || !numero) return alert("Preencha o nome e o número!");
    
    await fetch('/api/contatos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome, numero })
    });
    
    document.getElementById('novo-ctt-nome').value = '';
    document.getElementById('novo-ctt-num').value = '';
    
    carregarContatosDaAPI();
}

async function deletarContato(id) {
    await fetch(`/api/contatos/${id}`, { method: 'DELETE' });
    carregarContatosDaAPI();
}

function renderizarListaDoGerenciamento(contatos) {
    const container = document.getElementById('lista-contatos-salvos');
    if(!container) return;
    
    if(contatos.length === 0){
        container.innerHTML = `<p style="color: #64748b; font-size: 0.8rem; text-align: center;">Nenhum contato salvo.</p>`;
        return;
    }
    
    container.innerHTML = contatos.map(c => `
        <div style="display: flex; justify-content: space-between; align-items: center; background-color: #1e293b; padding: 0.7rem; border-radius: 0.5rem; border: 1px solid #334155; overflow-wrap: break-word; break-word: break-all;">
            <div>
                <strong style="color: white; font-size: 0.9rem; display: block;">${c.nome}</strong>
                <span style="color: #94a3b8; font-size: 0.75rem;">${c.numero}</span>
            </div>
            <button onclick="deletarContato('${c.id}')" style="background: none; border: none; color: #ef4444; cursor: pointer; font-size: 1rem;">🗑️</button>
        </div>
    `).join('');
}