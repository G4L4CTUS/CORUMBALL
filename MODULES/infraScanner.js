const snmp = require('net-snmp');

async function monitorarEqps(INFRA, OID_VERSAO) {
    const eqps = INFRA.filter(eq => (eq.tipo === 'rb' || eq.tipo === "switch") && eq.ip);
    
    return Promise.all(eqps.map(eq => {
        return new Promise((resolve) => {
            const session = snmp.createSession(eq.ip, "public", { timeout: 2000 });
            const oidsParaPedir = [];
            
            for (let i = 1; i <= eq.portas; i++) {
                const offset = 13;
                const indiceSNMP = i + offset;
                oidsParaPedir.push(`1.3.6.1.2.1.2.2.1.8.${indiceSNMP}`);
            }
            oidsParaPedir.push(OID_VERSAO);

            session.get(oidsParaPedir, (error, varbinds) => {
                if (!error) {
                    const statusPortas = {};
                    for (let i = 0; i < eq.portas; i++) {
                        const portaNum = i + 1;
                        statusPortas[portaNum] = {
                            cor: varbinds[i].value === 1 ? "#ef4444" : "#10b981",
                            descricao: varbinds[i].value === 1 ? "Link Ativo" : "Disponível"
                        };
                    }
                    const versaoRaw = varbinds[varbinds.length - 1].value.toString();

                    const matchModelo = versaoRaw.match(/RouterOS\s+([^\s]+)/);
                    const matchVersao = versaoRaw.match(/\d+\.\d+\.\d+/);            
                    const matchStatus = versaoRaw.match(/\((stable|long-term|testing|development)\)/);
                    const modeloExibicao = matchModelo ? matchModelo[1] : "MikroTik";
                    const versaoExibicao = matchVersao ? (matchVersao[0] + (matchStatus ? ` ${matchStatus[0]}` : "")) : "N/A";

                    session.close();
                    resolve({ 
                        eqId: eq.id, 
                        statusPortas, 
                        versao: versaoExibicao, 
                        modelo: modeloExibicao 
                    });
                } else {
                    session.close();
                    resolve(null);
                }
            });
        });
    }));
}

module.exports = { monitorarEqps };