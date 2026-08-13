const axios = require('axios');
const fs = require('fs');
const path = require('path');

const CACHE_FILE = path.join(__dirname, 'ram_cache.json');
let ramCache = {};

if (fs.existsSync(CACHE_FILE)) {
    try {
        ramCache = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'));
    } catch (e) {
        ramCache = {};
    }
}

function salvarCache() {
    try {
        fs.writeFileSync(CACHE_FILE, JSON.stringify(ramCache, null, 2));
    } catch (e) {
        console.error('[Cache Error] Erro ao salvar cache em disco:', e.message);
    }
}
async function atualizarRamSeMudou(urlBase, agent, apiKey) {
    const id = agent.agent_id;
    const bootTimeAtual = agent.boot_time || 0;
    
    const dadosSalvos = ramCache[id];
    if (dadosSalvos && dadosSalvos.bootTime === bootTimeAtual && dadosSalvos.ram !== 'N/A' && dadosSalvos.ram !== 'Buscando...') {
        return dadosSalvos.ram;
    }
    try {

        if (!dadosSalvos) {
            ramCache[id] = { ram: 'Buscando...', bootTime: bootTimeAtual };
        }

        const res = await axios.get(`${urlBase}/agents/${id}/`, {
            headers: { 'X-API-KEY': apiKey },
            timeout: 4000
        });

        const total = res.data?.total_ram;
        const ramFormatada = total ? `${total} GB` : 'N/A';

        ramCache[id] = {
            ram: ramFormatada,
            bootTime: bootTimeAtual
        };

        salvarCache();
        return ramFormatada;

    } catch (e) {

        return dadosSalvos?.ram || 'N/A';
    }
}

async function scanComputadores(UrlTactical, ApiKey) {
    try {
        const urlBase = UrlTactical.replace(/\/agents\/?$/, '').replace(/\/$/, '');

        const response = await axios.get(`${urlBase}/agents/`, {
            headers: { 'X-API-KEY': ApiKey, 'Content-Type': 'application/json' },
            timeout: 5000
        });

        const data = response.data;
        if (!Array.isArray(data)) return null;


        const computadoresPromessas = data.map(async (agent) => {
            let ramTotal = agent.total_ram ? `${agent.total_ram} GB` : null;

            if (!ramTotal && agent.agent_id) {
                ramTotal = await atualizarRamSeMudou(urlBase, agent, ApiKey);
            }

            return {
                id:            agent.agent_id,
                nome:          agent.hostname,
                ip:            (agent.local_ips || agent.public_ip || 'N/A').split(',')[0].trim(),
                cliente:       agent.client_name || 'GERAL',
                site:          agent.site_name || '',
                online:        agent.status === 'online',
                ultimoVisto:   agent.last_seen,
                so:            agent.operating_system || 'N/A',
                cpu:           agent.cpu_model || 'N/A',
                placamae:      agent.make_model || 'N/A',
                placadevideo:  agent.graphics || 'N/A',
                armazenamento: agent.physical_disks || [],
                ramtotal:      ramTotal || 'N/A',
                ramusada:      agent.used_ram || 0,
            };
        });

        const computadores = await Promise.all(computadoresPromessas);

        return computadores.sort((a, b) => (a.online === b.online ? 0 : a.online ? -1 : 1));

    } catch (err) {
        console.error('[Tactical Error]', err.message);
        return null;
    }
}

module.exports = { scanComputadores };