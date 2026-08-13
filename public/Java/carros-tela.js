
let listaChecklists;

document.addEventListener('DOMContentLoaded', function() {

    const btnNovo = document.getElementById('btn-novo-checklist');
    const modal = document.getElementById('modal-checklist');
    const btnFechar = document.getElementById('fechar-modal-carro');
    const form = document.getElementById('form-checklist');
    listaChecklists = document.getElementById('lista-checklists');
	
	function limparModal(){
		form.reset();
		modal.style.display = 'none';
	}; 
	
    btnNovo.addEventListener('click', () => modal.style.display = 'flex');
	
    btnFechar.addEventListener('click', () => limparModal());
    
    window.addEventListener('click', (e) => {
        if (e.target === modal) modal.style.display = 'none';
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault(); 
        
        const checkboxesMarcados = Array.from(document.querySelectorAll('input[name="manutencao"]:checked'));
		const CheckboxBatidas = Array.from(document.querySelectorAll('input[name="batidos"]:checked'));
        const novoDados = {
            placa: document.getElementById('carro-placa').value,
            hodometro: document.getElementById('carro-hodometro').value,
            motorista: document.getElementById('carro-motorista').value,
            tipo: document.getElementById('carro-tipo').value,
            manutencao: checkboxesMarcados.map(box => box.value),
            obs: document.getElementById('carro-obs').value,
			batidos: CheckboxBatidas.map(box => box.value),
			obsbatidas: document.getElementById('obsBatidas').value,
        };
		

        try {
            await fetch('/api/carros', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(novoDados)
            });

            form.reset(); 
            modal.style.display = 'none'; 
            carregarCarros(); 
            
        } catch (erro) {
            console.error('Erro ao salvar:', erro);
            alert('Erro ao salvar o checklist!');
        }
    });
    carregarCarros();
});
async function carregarCarros() {
    try {
        const resposta = await fetch('/api/carros');
        const carros = await resposta.json();
        
        listaChecklists.innerHTML = ''; 
        
        carros.forEach(carro => {
            const card = document.createElement('div');
            card.style.cssText = 'background: #334155; border: 1px solid #10b981; border-radius: 8px; padding: 15px; position: relative;';
            
			//criação dos elementos do card, aprendendo a evitar o inner.	
			const botaoDelete = document.createElement('button');
			botaoDelete.style.cssText = 'position: absolute; top: 10px; right: 10px; background: #ef4444; color: white; border: none; border-radius: 4px; cursor: pointer; padding: 5px 10px;'
			botaoDelete.textContent = 'Excluir'
			botaoDelete.addEventListener('click', (e)=>{
			deletarCarro(carro.id, e);
			});
			const placaCarro = document.createElement('h3');
			placaCarro.style.cssText = "margin-top: 0; color: white;";
			placaCarro.textContent = `Placa:${carro.placa}`;
	
			const registroData = document.createElement('p');
			registroData.style.cssText = "margin: 5px 0;color: white; font-size: 14px;"
			registroData.textContent = `Data: ${carro.dataRegistro}`;
			
			const motorista = document.createElement('p');
			motorista.style.cssText = "margin: 5px 0;color: white; font-size: 14px;";
			motorista.textContent = `Motorista: ${carro.motorista}`;
			
			const hodometro = document.createElement('p');
			hodometro.style.cssText = "margin: 5px 0;color: white; font-size: 14px;";
			hodometro.textContent = `Hodômetro: ${carro.hodometro}`;
			
			const tipo = document.createElement('p');
			tipo.style.cssText = "margin: 5px 0;color: white; font-size: 14px;";
			tipo.textContent = `Tipo: ${carro.tipo}`;
			
			const linhaDiv = document.createElement('hr')
			linhaDiv.style.cssText = "border: 0; border-top: 1px solid #cbd5e1; margin: 10px 0; color: #1e293b";
			
			const linhaDiv2 = linhaDiv.cloneNode(true);
			
			const manutencaoCarro = document.createElement('p');
			manutencaoCarro.style.cssText = "margin: 5px 0;color: whitesmoke; font-size: 14px;";
			
			const textoManut = carro.manutencao && carro.manutencao.length > 0 ? carro.manutencao.join(', ') : 'Nenhum item marcado';
			
			manutencaoCarro.textContent = `Itens verificados: ${textoManut}`;
			
			
			const observacaoCarros = document.createElement('p');
			observacaoCarros.style.cssText = "margin: 5px 0;color: whitesmoke; font-size: 14px; overflow-wrap: break-word; word-break: break-all;";
			observacaoCarros.textContent = `OBS: ${carro.obs || `Nenhuma`}`;
			
			const LocaisBatidos = document.createElement('p');
			LocaisBatidos.style.cssText = "margin: 5px 0;color: whitesmoke; font-size: 14px;"
			const textBatido = carro.batidos && carro.batidos.length > 0 ? carro.batidos.join(', ') : 'Nenhum item marcado';
			LocaisBatidos.textContent=`Locais avariados: ${textBatido}`;
			
			const observacaoBatidas = document.createElement('p');
			observacaoBatidas.style.cssText = "margin: 5px 0;color: whitesmoke; font-size: 14px; overflow-wrap: break-word; word-break: break-all;";
			observacaoBatidas.textContent = `OBS: ${carro.obsbatidas || "Nenhuma"}`;
			
			card.appendChild(botaoDelete);
			card.appendChild(placaCarro);
			card.appendChild(hodometro);
			card.appendChild(motorista);
			card.appendChild(registroData);
			card.appendChild(linhaDiv);
			card.appendChild(manutencaoCarro);
			card.appendChild(observacaoCarros);
			card.appendChild(linhaDiv2);
			card.appendChild(LocaisBatidos);
			card.appendChild(observacaoBatidas);
			listaChecklists.appendChild(card);
        });
    } catch (erro) {
        console.error('Erro ao carregar carros:', erro);
    }
}
async function deletarCarro(id, event) {
    if (event) event.preventDefault();
    try {  

        const resposta = await fetch(`/api/carros/${id}`, {
            method: 'DELETE'
        });
        if (resposta.ok) {
            carregarCarros();                    
        } else {
            console.error('O backend falhou em deletar.');
            alert('Erro ao deletar o carro. Tente novamente.');
        }
    } catch (erro) {
        console.error('Falha de rede ou servidor fora do ar:', erro);
    }
}