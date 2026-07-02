
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
