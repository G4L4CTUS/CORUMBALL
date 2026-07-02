socket.on('recadosUpdate', function(data) {
	renderRecados(data);
});
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