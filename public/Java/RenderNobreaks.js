
document.addEventListener('DOMContentLoaded', carregarNobreaks);

let nobreaksMemoria = [];

async function carregarNobreaks() {
    try {
        const res = await fetch('/api/nobreaks');
        const data = await res.json();
        renderNobreaks(data);
    } catch (erro) {
        console.error("Erro ao buscar nobreaks:", erro);
    }
}

function renderNobreaks(data) {
	nobreaksMemoria = data;
    const tabNobreaks = document.getElementById('tab-nobreaks');
    if (!tabNobreaks) return;

    let container = document.getElementById('lista-nobreaks');
    if (!container) {
        tabNobreaks.innerHTML = `
            <div style="margin: 2rem auto;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
                    <h2 class="texto_padrão">
                        <span style="color: #facc15;">⚡</span> NOBREAKS ATIVOS
                    </h2>
                    <button class="botão_add" onclick="abrirModalNobreak()" style="background-color: #eab308; color: #0f172a;">
                        + Novo Nobreak
                    </button>
                </div>
                <div id="lista-nobreaks" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 1.5rem;"></div>
            </div>
        `;
        container = document.getElementById('lista-nobreaks');
    }

    if (!data || !data.length) {
        container.innerHTML = `<p style="color:#64748b;">Nenhum nobreak encontrado.</p>`; 
        return;
    }

    container.innerHTML = data.map(function(item) {
        return `
        <div style="background-color: #0f172a; border-left: 4px solid #facc15; padding: 1rem; border-radius: 1rem; margin-bottom: 1rem; box-shadow: 4px 6px rgba(0,0,0,0.3); position: relative;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                <span style="font-size: 0.65rem; font-weight: 800; color: #facc15; text-transform: uppercase; letter-spacing: 0.05em;">
                    Equipamento
                </span>
				<button onclick="abrirModalEditar('${item.id}')" style="position: absolute; right: 5rem; top: 1rem; background:none; border: none; cursor: pointer; color: #60a5fa; font-size: 0.8rem; font-weight: 700;">editar</button>
				<button onclick="deletarNobreak('${item.id}')" style="position: absolute; right: 1rem; top: 1rem; background:none; border: none; cursor: pointer; color: rgba(255,255,255,0.3); font-size: 0.8rem; font-weight: 700;" onmouseover="this.style.color='#ef4444'" onmouseout="this.style.color='rgba(255,255,255,0.3)'">🗑️</button>
            </div>
            <h4 style="font-size: 1.1rem; font-weight: 700; color: #f1f5f9; margin-bottom: 0.25rem; overflow-wrap: break-word; word-break: break-all;">${item.nome}</h4>
            <p style="font-size: 0.85rem; color: #e2e8f0; margin-bottom: 0.25rem; overflow-wrap: break-word;"><strong>Local:</strong> ${item.local}</p>
            <p style="font-size: 0.8rem; color: #94a3b8; line-height: 1.4; overflow-wrap: break-word; word-break: break-all;">${item.desc || 'Sem descrição'}</p>
        </div>`;           
    }).join('');
}
function abrirModalEditar(id){
	const nobreak = nobreaksMemoria.find(nb => nb.id == id);
	if (!nobreak) return;
	document.getElementById('nb-id').value = nobreak.id;
	document.getElementById('nb-nome').value = nobreak.nome;
	document.getElementById('nb-local').value = nobreak.local;
	document.getElementById('nb-desc').value = nobreak.desc || '';
	
	document.getElementById('titulo-modal-nobreak').innerText = "EDITAR NOBREAK";
	const modal = document.getElementById('modal-nobreak');
	if (modal) modal.style.display = 'flex';
}

function abrirModalNobreak() {
    const modal = document.getElementById('modal-nobreak');
    if (modal) modal.style.display = 'flex';
}

function fecharModalNobreak() {
    const modal = document.getElementById('modal-nobreak');
    if (modal) modal.style.display = 'none';
    
	document.getElementById('nb-id').value = '';
    document.getElementById('nb-nome').value = ''; 
    document.getElementById('nb-local').value = '';
    document.getElementById('nb-desc').value = '';
	document.getElementById('titulo-modal-nobreak').innerText = "NOVO NOBREAK";
}

async function salvarNobreak() {
    try {
		const id = document.getElementById('nb-id').value;
        const nome = document.getElementById('nb-nome').value;
        const local = document.getElementById('nb-local').value;
        const desc = document.getElementById('nb-desc').value;
        
        if (!nome || !local) {
            alert("Preencha o nome e o local.");
            return;
        }
		 const dados = {nome, local, desc};
		 let url = '/api/nobreaks';
		 let metodo = 'POST';
		 
		 if (id){
			 url = `/api/nobreaks/${id}`;
			 metodo = 'PUT';
		 }

        const resposta = await fetch(url, {
            method: metodo,
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(dados)
        });

        if (resposta.ok) {
            fecharModalNobreak();
            carregarNobreaks(); 
        } 
    } catch(erro) {
        console.log("Erro ao salvar o nobreak:", erro);
        alert("Erro ao conectar ao servidor");
    }
}

async function deletarNobreak(id) {
    if (!confirm("Deseja realmente excluir esse Nobreak?")) return;
    try {
        const resposta = await fetch(`/api/nobreaks/${id}`, {
            method: 'DELETE'
        });
        
        if (resposta.ok) {
            carregarNobreaks(); 
        } else {
            alert("Erro ao deletar o nobreak");
        }
    } catch (erro) {
        console.error("Erro na requisição:", erro);
    }
}