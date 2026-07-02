let modoAtualAtendimentos = 'abertos';
socket.on('atendimentosUpdate', function(data) {
    if (modoAtualAtendimentos === 'abertos') {
        RenderAtendimentos(data);
    }
});
function AbrirModalAtendimento() {
    const modal = document.getElementById('modal-atendimento');
    if (modal) modal.style.display = 'flex';
}
function FecharModalAtendimento(){
    const modal = document.getElementById('modal-atendimento');
    if (modal) modal.style.display = 'none';
    document.getElementById('NomeAtendimento').value = '';
    document.getElementById('Local').value = '';
    document.getElementById('RtdEqp').checked = false;
    document.getElementById('DataChegada').value = '';
    document.getElementById('descricaoAtd').value = '';
}

async function SalvarModalAtendimento(){
    try {
        const nomeAtendimento = document.getElementById('NomeAtendimento').value;
        const local = document.getElementById('Local').value;
        const rtdEqp = document.getElementById('RtdEqp').checked; 
        const dataChegada = document.getElementById('DataChegada').value;
        const descricaoAtd = document.getElementById('descricaoAtd').value;
        if (!nomeAtendimento || !local || !dataChegada || !descricaoAtd){
            alert("Todos os campos obrigatórios têm que ser preenchidos");
            return;
        }
        const Novo_Atendimento = {
            NomeAtendimento: nomeAtendimento,
            Local: local,
            RtdEqp: rtdEqp,
            DataChegada: dataChegada,
            descricaoAtd: descricaoAtd
        };

        const resposta = await fetch('/api/atendimentos', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(Novo_Atendimento)
        });
        if (resposta.ok) {
            FecharModalAtendimento();
        } 
    } catch(erro){
        console.log("Erro ao salvar o atendimento:", erro);
        alert("Erro ao conectar ao servidor");
    }
};
function finalizarAtendimento(id) {
    const modal = document.getElementById('atendimento-finalizacao');
    if (modal) {
        modal.style.display = 'flex';
        document.getElementById('finalizar-id').value = id;
    }
}
function FecharModalFinalizacao() {
    const modal = document.getElementById('atendimento-finalizacao');
    if (modal) modal.style.display = 'none';
    document.getElementById('resolucaoAtd').value = '';
    document.getElementById('finalizar-id').value = '';
}
async function EnviarFinalizacao() {
    const id = document.getElementById('finalizar-id').value;
    const resolucao = document.getElementById('resolucaoAtd').value;

    if (!resolucao.trim()) {
        alert("Por favor, preencha a resolução antes de concluir!");
        return;
    }

    try {
        const resposta = await fetch(`/api/atendimentos/${id}/finalizar`, {
            method: 'PUT',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ resolucao: resolucao })
        });
        
        if (resposta.ok) {
            FecharModalFinalizacao();
        } else {
            alert("Erro ao finalizar o atendimento no servidor");
        }
    } catch (erro) {
        console.error("Erro na requisição de finalização:", erro);
    }
}
async function deletarAtendimento(id) {
    if (!confirm("Deseja realmente apagar em definitivo esse chamado sem histórico?")) return;
    try {
        const resposta = await fetch(`/api/atendimentos/${id}`, {
            method: 'DELETE'
        });
        if (!resposta.ok) {
            alert("Erro ao deletar o atendimento");
        }
    } catch (erro) {
        console.error("Erro na requisição de exclusão:", erro);
    }
}
function MudarModoAtendimento(modo) {
    modoAtualAtendimentos = modo;
    const btnAbertos = document.getElementById('btn-modo-abertos');
    const btnFinalizados = document.getElementById('btn-modo-finalizados');
    const btnAdd = document.getElementById('btn-add-atendimento');

    if (modo === 'finalizados') {
        btnFinalizados.style.backgroundColor = '#10b981'; 
        btnFinalizados.style.color = 'white';
        btnAbertos.style.backgroundColor = '#1e293b';
        btnAbertos.style.color = '#64748b';
        if (btnAdd) btnAdd.style.display = 'none';
    } else {
        btnAbertos.style.backgroundColor = '#2563eb'; 
        btnAbertos.style.color = 'white';
        btnFinalizados.style.backgroundColor = '#1e293b';
        btnFinalizados.style.color = '#64748b';
        if (btnAdd) btnAdd.style.display = 'block'; 
    }
    BuscarAtendimentos(); 
}

async function BuscarAtendimentos() {
    const url = modoAtualAtendimentos === 'finalizados' ? '/api/atendimentos?status=finalizados' : '/api/atendimentos';
    try {
        const resposta = await fetch(url, { cache: 'no-store' });
        const dados = await resposta.json();
        RenderAtendimentos(dados);
    } catch (erro) {
        console.error("Erro ao buscar atendimentos:", erro);
    }
}
function RenderAtendimentos(data) {
    console.log("Atendimentos carregados");
    const container_atendimentos = document.getElementById('atendimento_importantes');
    if (!container_atendimentos) return;

    if (!data.length) {
        container_atendimentos.innerHTML = `<h2 style="color:#64748b; font-weight: 700; text-align: center; padding: 2rem;">💥 PUTA MERDA, MATARAM O KENNY!!! Desgraçados!</h2>`;
        return;
    }

    container_atendimentos.innerHTML = data.map(function(atd) {
        const corBorda = atd.retirado ? 'border: 2px solid #ef4444;' : 'border: 1px solid #1e293b;';
        const dataFormatada = atd.dataChegada ? new Date(atd.dataChegada).toLocaleString('pt-BR') : 'N/A';
        
        return `
        <div style="background-color: #0f172a; padding: 20px; border-radius: 12px; ${corBorda} position: relative; margin: 12px; width: 300px; display: flex; flex-direction: column; align-items: center; text-align: center; height: 300px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.2);">
            <button onclick="deletarAtendimento(${atd.id})" style="position: absolute; top: 12px; right: 12px; background: none; border: none; cursor: pointer; font-size: 12px;">🗑️</button>
    
            <div style="margin-bottom: 0.5rem;">
                <span style="font-size: 0.65rem; font-weight: 800; color: ${atd.retirado ? '#ef4444' : '#10b981'}; text-transform: uppercase; letter-spacing: 0.05em;">
                    ${atd.retirado ? '⚠️ Retirada de Equipamento' : '✓ Atendimento Local'}
                </span>
            </div>
            
            <h3 style="font-size: 1rem; font-weight: 700; text-transform: uppercase; color: #f1f5f9; margin-bottom: 0.25rem;">${atd.nome}</h3>
            <p style="font-size: 13px; color: #64748b; font-family: monospace; margin-bottom: 6px;">📍 ${atd.local}</p>
    
            <div style="background-color: #0f172a; padding: 7px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.01); height: 90px; width: 100%; overflow-y: auto; margin-bottom: 10px;">
                <p style="font-size: 12px; color: #94a3b8; line-height: 1.5; overflow-wrap: break-word; white-space: pre-wrap; max-width: 250px; margin: 0 auto;">${atd.descricao}</p>
            </div> 
            
            ${atd.finalizado 
                ? `
                <div style="width: 100%; padding-top: 10px; margin-top: auto; border-top: 1px solid rgba(16,185,129,0.4); text-align: center;">
                    <p style="font-size: 10px; color: #10b981; font-weight: 800; text-transform: uppercase; margin-bottom: 4px;">✅ RESOLUÇÃO APLICADA</p>
                    <p style="font-size: 11px; color: #cbd5e1; max-height: 40px; overflow-y: auto; margin-bottom: 6px;">${atd.resolucao}</p>
                    <span style="font-size: 9px; color: #475569;">Fechado: ${new Date(atd.dataFinalizado).toLocaleString('pt-BR')}</span>
                </div>
                `
                : `
                <div style="display: flex; width: 100%; font-size: 0.65rem; color: #475569; border-top: 1px solid rgba(30,41,59,0.4); padding-top: 10px; margin-top: auto; flex-direction: column; align-items: center; gap: 8px;">
                    <button onclick="finalizarAtendimento(${atd.id})" style="background-color: #10b981; color: white; font-weight: 700; font-size: 0.75rem; padding: 6px 16px; border-radius: 0.5rem; border: none; cursor: pointer; text-transform: uppercase; transition: background 0.2s;" onmouseover="this.style.backgroundColor='#059669'" onmouseout="this.style.backgroundColor='#10b981'">
                        ✓ Concluir Chamado
                    </button>
                    <span>Chegada: ${dataFormatada}</span>
                </div>
                `
            }
        </div>`;
    }).join('');
}


         
	

