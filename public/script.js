
        function AbrirModalAtendimento() {
        const modal = document.getElementById('modal-atendimento');
        if (modal) modal.style.display = `flex`;
        }

        const socket = io();
        socket.on('printerUpdate', function(data) {
            window.ultimosDadosImpressora=data;
        renderImpressoras(data);
    });
    socket.on('computerUpdate', function(data) {
        todosComputadores = data; 
        atualizarOpcoesFiltro(data);
        aplicarFiltroComputadores();
    });

    socket.on('recadosUpdate', function(data) {
        renderRecados(data);
    });
    function atualizarOpcoesFiltro(data) {
        const select = document.getElementById('filtro-cliente');
        const valorSelecionadoAntes = select.value;
        const clientes = [...new Set(data.map(pc => pc.cliente))].filter(Boolean).sort();
        
        let html = '<option value="todos">TODOS</option>';
        clientes.forEach(cliente => {
            html += `<option value="${cliente}">${cliente.toUpperCase()}</option>`;
        });
        select.innerHTML = html;
        select.value = valorSelecionadoAntes; // Mantém o que o usuário já tinha filtrado
    }

    function aplicarFiltroComputadores() {
        const filtro = document.getElementById('filtro-cliente').value;
        if (filtro === 'todos') {
            renderComputadores(todosComputadores);
        } else {
            const filtrados = todosComputadores.filter(pc => pc.cliente === filtro);
            renderComputadores(filtrados);
        }
    }


	document.addEventListener('DOMContentLoaded', function() {
		const tabBtns = document.querySelectorAll('.tab-btn');
    
		tabBtns.forEach(function(btn) {
			btn.addEventListener('click', function() {
				const tabAlvo = btn.dataset.tab;
				tabBtns.forEach(function(b) { 
					b.style.color = '#64748b';
					b.classList.remove('active');
				});
            document.querySelectorAll('.tab-panel').forEach(function(p) { 
                p.style.display = 'none';
                p.classList.remove('active');
            });
            btn.style.color = 'white';
            btn.classList.add('active'); 
            const painelAlvo = document.getElementById('tab-' + tabAlvo); 
            if (painelAlvo) {
                painelAlvo.style.display = 'block';
                painelAlvo.classList.add('active');
            } else {
                console.warn(`Painel com id "tab-${tabAlvo}" não foi encontrado no HTML.`);
            }
            const btnAdd = document.getElementById('btn-add-printer');
            if (btnAdd) {
                if (tabAlvo === 'impressoras') {
                    btnAdd.style.display = '';
                } else {
                    btnAdd.style.display = 'none';
                }
            }
        });
    });
});

        let abertos = JSON.parse(localStorage.getItem('abertos') || '[]');

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
                const conteudoInterno = estaAberto
                    ? '<div style="padding: 1.5rem; border-top: 1px solid rgba(30, 41, 59, 0.4); background-color: rgba(0,0,0,0.1);"><div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1.5rem;">' + grupo.items.map(function(impressora) { return cardImpressora(impressora); }).join('') + '</div></div>'
                    : '';

                return`
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
    // 1. PRIMEIRO verificamos se é térmica e retornamos o layout correto IMEDIATAMENTE
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

    // 2. Se não for térmica, continua para construir a Laser
    const coresDeToner = ['#94a3b8', '#22d3ee', '#ec4899', '#facc15'];
    const nomesToner = impressora.isColor ? ['K', 'C', 'M', 'Y'] : ['TONER'];
    const toners = impressora.toners || [];
    
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

    // Cria array vazio se impressora.errorMessages não existir
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
                '<p style="font-size: 0.625rem; color: #475569; text-transform: uppercase; margin-top: 0.125rem;">' + impressora.model + '</p>' +
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
            modal.style.display = 'flex';
        }

        function fecharModalImpressora() {
            const modal = document.getElementById('modal-impressora');
            modal.style.display = 'none';
        }
      
        async function salvarImpressora() {
            const unidade = document.getElementById('in-unit').value;
            const setor = document.getElementById('in-name').value;
            const endereco = document.getElementById('in-ip').value;
            const modelo = document.getElementById('in-model').value;

            const corpo = {
                unit: unidade,
                name: setor,
                ip: endereco,
                model: modelo
            };

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

            await fetch('/api/printers/' + idImpressora, {
                method: 'DELETE'
            });
        }
    function renderComputadores(data){
        console.log("Dados dos PCs recebidos:", data);
        const lista = document.getElementById(`lista-computadores`);
        if(!data.length) {
            lista.innerHTML = `<p style="color:#64748b;">Nenhum computador encontrado.</p>`;
            return;
        }
        lista.innerHTML = data.map(function(pc){
            const corStatus = pc.online ? `#10b981` : `#dc2626`;
            const textoStatus = pc.online ? `ONLINE` : `OFFLINE`;
            const UltimoVisto = pc.online ? `Agora` : new Date(pc.ultimoVisto).toLocaleString('pt-BR');
                return `<div style="background-color:#0d1117; padding:1.25rem; border-radius:1rem; border: 3px solid; border-color: `+corStatus+` ">` +
                `<div style="display:flex; justify-content:space-between; align-items: flex-start; margin-bottom: 1rem;">`+
                    '<div>' +
                        '<h3 style ="font-size:20px; font-weight:700; text-transform:uppercase; letter-spacing:-0.060rem; margin-left:105px;">' +pc.nome + '</h3>' +
                        '<p style="font-size:13px; color:#64748b; font-family:monospace; margin-left: 1px;">' + pc.ip + '</p>' +
                        '<p style="font-size:10px; color:#475569; text-transform:uppercase; margin-top:10px;">' +pc.cliente + ' . ' + pc.site + '</p>' +
                    '</div>' +
                    '<div style="display:flex; flex-direction:column; align-items:flex-end; gap:0.25;">' +
                        '<div style="width:0.625rem; height:0.625rem; border-radius:9999px; background-color:'+corStatus+ ';"></div>' +
                        '<span style="font-size:0.5625rem; color:#475569; text-transform:uppercase;">' + textoStatus + '</span>' +
                    '</div>' +
                '</div>' +
                '<p style="font-size:0.625rem; color:#64748b; text-transform:uppercase; margim-bottom:0.75rem;">' + (pc.so || 'N/A') + '</p>' +
                '<div style="margin-bottom:0.75rem;">' +
                    '<div style="display:flex; justify-content:space-between; font-size:0.625rem; color:#64748b; margin-bottom:0.25rem; margin-top: 2px;">' +
                        '<p>' + pc.cpu +'</p>' +
                    '</div>' +
                '</div>' +
                '<div style="display:flex; justify-content:space-between; font-size:0.625rem; color:#64748b; padding-top:0.75rem; border-top:1px solid rgba(30,41,59,0.4);">'+
                    '<span>' + UltimoVisto + '</span>' +
                '</div>' +
            '</div>';
        }).join('');
    }

        
    function renderRecados(data) {
        console.log("Recados importantes:", data);
        const container_recados = document.getElementById('Recados-importantes');
        if(!data.length){
            recados.innerHTML = `<p style="color:#64748b;">Nenhum computador encontrado.</p>`; 
            return;
        };
    
        container_recados.innerHTML = data.map(function(item){
            const corBorda = item.urgente ? '#ef4444' : '#f59e0b';
            const dataFormatada = new Date(item.data).toLocaleString('pt-BR');
            return `
            <div style="background-color: #0f172a; border-left: 4px solid ${corBorda}; padding: 1rem; border-radius: 1rem; margin-bottom: 1rem; box-shadow: 4px 6px rgba(0,0,0,0.3);">
                <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem; position: relative;">
                    <span style="font-size: 0.65rem; font-weight: 800; color: ${corBorda}; text-transform: uppercase; latter-space: 0.05em ">
                        ${item.urgente ? `Urgente` : `Lembrete`}
                        </span>
                        <span style="position: absolute;font-size: 0.6em; color:#475569; left: 120px">${dataFormatada}</span>
                        <button onclick="deletarRecado('${item.id}')" style="position:absolute; margin-top: 1px; left: 300px;background:none; border: none; cursor: pointer; color: rgba(255,255,255,0.3); font-size: 1rem; "onmouseover="this.style.color='#ef4444'" onmouseout="this.style.color='rgba(255,255,255,0.3)'">apagas</button>
                </div>
                <h4 style="font-size: 0.9rem; font-weight: 700; color: #f1f5f9; margin-bottom: 0.25rem;overflow-wrap: break-word; word-break: break-all;">${item.titulo}</h4>
                    <p style="font-size: 0.8rem; color: #94a3b8; line-height: 1.4; overflow-wrap: break-word; word-break: break-all;">${item.mensagem}</p>
                    <div style="margin-bottom: 7px;margin-top: 12px; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 1rem; position:">
                        <span style="font-size: 0.70rem; color: #475569; font-style: italic;">Por: ${item.autor || 'Sistema'}</span>
                    </div>
                </div> `;           
            }).join('');
    }
    function abrirModalRecado() {
        const modal = document.getElementById('modal-recado')
        if (modal) modal.style.display=`flex
        `;
    }
    function fecharModalrecado(){
        const modal = document.getElementById('modal-recado')
        if (modal) modal.style.display = `none`;
        document.getElementById(`titulo-lembrete`).value = ``; 
        document.getElementById(`Desc-lembrete`).value = ``;
        document.getElementById(`Recado-urgente`).checked = false;
    }
async function salvarRecado() {
    try{
        const titulo = document.getElementById(`titulo-lembrete`).value;
        const texto_lembrete = document.getElementById(`Desc-lembrete`).value;
        const urgente = document.getElementById(`Recado-urgente`).checked;;
        const corumbas = document.getElementById(`Corumbinha`).value
        
        
        if (!titulo || !texto_lembrete){
            alert("Prencha o título e a mensagem.");
            return;
        }

const novo_recado ={
    titulo: titulo,
    mensagem: texto_lembrete,
    urgente: urgente,
    autor: corumbas,
    data: new Date().toISOString()
};
        const resposta = await fetch(`/api/recados`, {
            method: `POST`,
            headers: {'Content-Type': `application/json`},
            body: JSON.stringify(novo_recado)
        });
        if (resposta.ok) {
            fecharModalrecado();
        } 
    } catch(erro){
        console.log("Erro ao salvar o lembrete:", erro);
        alert("Erro ao conectar ao servidor");
        }
};
    async function deletarRecado(id) {
        if (!confirm("Deseja realmente excluir esse recado?")) return;
        try {
            const resposta = await fetch(`/api/recados/${id}`, {
                method: `DELETE`
            });
            if (!resposta.ok) {
                alert("erro ao deletar o recado");
            }
        } catch (erro) {
            console.error("Erro na requisição: erro");
        }
    };
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
        <div style="font-size:45px; text-align:center; margin-bottom:15px; filter: drop-shadow(0 0 10px rgba(96, 165, 250, 0.3));">
            ${eq.tipo === 'rb' ? `<img src = "\RB.png" alt="ih rapaz", width = 200px, height=100px>` : '<img src="/switch.png", alt="deu ruim rapá", width= 600px, height=200px >'}
        </div>
        <div style="display:grid; grid-template-columns:repeat(${eq.tipo === 'rb' ? 5 : 12}, 1fr); gap:8px; justify-items: center;">
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

