const axios = require('axios');
async function scanComputadores(UrlTactical, ApiKey) {
    try {
        const response = await axios.get(UrlTactical, {
            headers: { 'X-API-KEY': ApiKey, 'Content-Type': 'application/json' },
            timeout: 5000
        });
        const data = response.data;
        if (!Array.isArray(data)) return;

        const Computadores = data.map(agent => ({
            id: agent.agent_id,
            nome: agent.hostname,
            ip: (agent.local_ips || 'N/A').split(',')[0].trim(),
            cliente: agent.client_name || 'GERAL',
            site: agent.site_name || '',
            online: agent.status === 'online',
            ultimoVisto: agent.last_seen,
            so: agent.operating_system || 'N/A',
            cpu: agent.cpu_model,
        }));

        const ComputierOrdenados = Computadores.sort((a, b) => (a.online === b.online) ? 0 : a.online ? -1 : 1);
        return ComputierOrdenados;
    } catch (err) {
        console.error('[Tactical Error]', err.message);
		return null
    }
}

module.exports = { scanComputadores};