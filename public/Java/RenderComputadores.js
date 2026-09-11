let todosComputadores = [];
socket.on('computerError', (dadosErro) => {
    const listaHtml = document.getElementById('lista-computadores');
    listaHtml.innerHTML = `
        <div style="background: #7f1d1d; border: 1px solid #ef4444; border-radius: 8px; padding: 20px; color: white;">
            <h3 style="margin-top: 0;">⚠️ Módulo Inoperante</h3>
            <p>${dadosErro.mensagem}</p>
            <p style="font-size: 12px; color: #fca5a5;">Ação necessária: Configure as variáveis TACTICAL_URL e TACTICAL_API_KEY no arquivo .env do servidor.</p>
        </div>
    `;
});
socket.on('computerUpdate', function(data) {
	todosComputadores = data; 
	atualizarOpcoesFiltro(data);
	aplicarFiltroComputadores();
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
	select.value = valorSelecionadoAntes; 
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
function renderComputadores(data){
        console.log("Dados dos PCs recebidos:", data);
        const listaHtml = document.getElementById(`lista-computadores`);
		listaHtml.innerHTML = '';
		 if (!data || data.length === 0) {
			listaHtml.innerHTML = '<p style="color: white;">Nenhum computador encontrado.</p>';
			return;
		};
		data.forEach(pc => {
			const corStatus = pc.online ? `#10b981` : `#dc2626`;
            const textoStatus = pc.online ? `ONLINE` : `OFFLINE`;
            const UltimoVisto = pc.online ? `Agora` : new Date(pc.ultimoVisto).toLocaleString('pt-BR');
			const card = document.createElement('div');
			card.style.cssText = `background-color:#0d1117; padding:1.25rem; border-radius:1rem; border: 3px solid ${corStatus}; margin-bottom: 15px;`;
			
			const headerContainer = document.createElement('div');
			headerContainer.style.cssText = "display:flex; justify-content:space-between; align-items: flex-start; margin-bottom: 1rem;";
			
			
			const infoBloco = document.createElement('div');
			
			const pcNome = document.createElement('h3');
			pcNome.style.cssText = "font-size:20px; font-weight:700; text-transform:uppercase; letter-spacing:-0.060rem; margin-left:100px; color: white;";
			pcNome.textContent = pc.nome;
			
			const pcIp = document.createElement('p');
			pcIp.style.cssText = "font-size:13px; color:#64748b; font-family:monospace; margin-left: 1px; margin-top: 5px;";
			pcIp.textContent = pc.ip;
			
			const pcCliente = document.createElement('p');
			pcCliente.style.cssText = "font-size:10px; color:#475569; text-transform:uppercase; margin-top:10px;";
			pcCliente.textContent = `${pc.cliente} . ${pc.site}`;
			
			infoBloco.appendChild(pcNome);
			infoBloco.appendChild(pcIp);
			infoBloco.appendChild(pcCliente);
			
			const statusBloco = document.createElement('div');
			statusBloco.style.cssText = "display:flex; flex-direction:column; align-items:flex-end; gap:0.25rem;";
			
			const bolinhaStatus = document.createElement('div');
			bolinhaStatus.style.cssText = `width:0.625rem; height:0.625rem; border-radius:9999px; background-color:${corStatus};`;
			
			const textoStatusSpan = document.createElement('span');
			textoStatusSpan.style.cssText = "font-size:0.5625rem; color:#475569; text-transform:uppercase;";
			textoStatusSpan.textContent = textoStatus;
			
			statusBloco.appendChild(bolinhaStatus);
			statusBloco.appendChild(textoStatusSpan);
			

			headerContainer.appendChild(infoBloco);
			headerContainer.appendChild(statusBloco);
			

			const pcSo = document.createElement('p');
			pcSo.style.cssText = "font-size:0.625rem; color:#64748b; text-transform:uppercase; margin-bottom:0.75rem;";
			pcSo.textContent = `SO: ${pc.so || 'N/A'}`;
			

			const hardwareBloco = document.createElement('div');
			hardwareBloco.style.cssText = "margin-bottom:0.75rem;";
			
	 
			const criarLinhaHardware = (label, valor) => {
				const linhaDiv = document.createElement('div');
				linhaDiv.style.cssText = "display:flex; justify-content:space-between; font-size:0.625rem; color:#64748b; margin-bottom:0.25rem; margin-top: 2px;";
				const linhaTexto = document.createElement('p');
				linhaTexto.textContent = `${label}: ${valor}`;
				linhaDiv.appendChild(linhaTexto);
				return linhaDiv;
			};

	 
			hardwareBloco.appendChild(criarLinhaHardware('CPU', pc.cpu));
			hardwareBloco.appendChild(criarLinhaHardware('PLACA DE VÍDEO', pc.placadevideo));
			hardwareBloco.appendChild(criarLinhaHardware('ARMAZENAMENTO', pc.armazenamento));
			hardwareBloco.appendChild(criarLinhaHardware('PLACA MÃE', pc.placamae));
			hardwareBloco.appendChild(criarLinhaHardware('MEMÓRIA RAM', pc.ramtotal));

			const rodapeBloco = document.createElement('div');
			rodapeBloco.style.cssText = "display:flex; justify-content:space-between; font-size:0.625rem; color:#64748b; padding-top:0.75rem; border-top:1px solid rgba(30,41,59,0.4);";
			
			const ultimoVistoSpan = document.createElement('span');
			ultimoVistoSpan.textContent = UltimoVisto;
			
			rodapeBloco.appendChild(ultimoVistoSpan);

			card.appendChild(headerContainer);
			card.appendChild(pcSo);
			card.appendChild(hardwareBloco);
			card.appendChild(rodapeBloco);


			listaHtml.appendChild(card);
		});
	}