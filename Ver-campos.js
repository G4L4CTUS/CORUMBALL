const axios = require('axios');

const TACTICAL_URL = 'https://api.corumba.digital';
const TACTICAL_API_KEY = 'GVJKFTQXSLPAIRI1EWU6ZXRWHLSB6URO';

async function testarDetalhes() {
    try {
        const urlBase = TACTICAL_URL.replace(/\/agents\/?$/, '').replace(/\/$/, '');
        
        console.log(`📡 Buscando lista inicial de computadores...`);
        const listRes = await axios.get(`${urlBase}/agents/`, {
            headers: { 'X-API-KEY': TACTICAL_API_KEY }
        });

        const lista = Array.isArray(listRes.data) ? listRes.data : (listRes.data.agents || []);
        const agente = lista[0];

        if (!agente) {
            console.log('❌ Nenhum computador encontrado.');
            return;
        }

        console.log(`✅ Computador selecionado: ${agente.hostname} (ID: ${agente.agent_id})`);
        console.log(`📡 Consultando dados detalhados de hardware...\n`);

        const detailRes = await axios.get(`${urlBase}/agents/${agente.agent_id}/`, {
            headers: { 'X-API-KEY': TACTICAL_API_KEY }
        });

        // DEFINIÇÃO DA VARIÁVEL 'detalhes' PARA EVITAR O ERRO:
        const detalhes = detailRes.data;
        const wmi = detalhes.wmi_detail || {};

        console.log('====================================================');
        console.log('📌 EXTRATO DE HARDWARE PROCESSADO:');
        console.log('====================================================');
        
        // 1. Memória RAM Total
        const totalRamGb = detalhes.total_ram ? `${detalhes.total_ram} GB` : 'Não informado';
        console.log('💾 RAM Total:', totalRamGb);

        // 2. Modelo do Processador (CPU)
        const cpuObj = wmi.cpu?.[0]?.[0] || wmi.cpu?.[0];
        const cpuNome = cpuObj?.Name || cpuObj?.Name?.[0] || 'N/A';
        console.log('🖥️ Processador (CPU):', cpuNome);

        // 3. Placa de Vídeo
        const gpuObj = wmi.graphics?.[0]?.[0] || wmi.graphics?.[0];
        const gpuNome = gpuObj?.Name || gpuObj?.Caption || 'N/A';
        console.log('🎮 Placa de Vídeo:', gpuNome);

        // 4. Placa Mãe e Modelo do PC
        const moboObj = wmi.base_board?.[0]?.[0] || wmi.base_board?.[0];
        console.log('🛠️ Placa Mãe:', `${moboObj?.Manufacturer || ''} ${moboObj?.Product || ''}`.trim() || 'N/A');

        console.log('\n====================================================');
        console.log('🔍 ESTRUTURA BRUTA DA CPU (Para conferir as chaves):');
        console.log('====================================================');
        console.log(JSON.stringify(wmi.cpu, null, 2));

    } catch (err) {
        if (err.response) {
            console.error(`❌ Erro HTTP ${err.response.status}:`, err.response.data);
        } else {
            console.error('❌ Erro de Execução:', err.message);
        }
    }
}

testarDetalhes();