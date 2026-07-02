const snmp = require('net-snmp');

function parseToner(val) {
    const v = parseInt(val);
    if (v === -2 || v === -3) return { label: 'OK', percent: 100, isAlert: false };
    if (v >= 0 && v <= 100) return { label: `${v}%`, percent: v, isAlert: v <= 10 };
    return { label: 'N/A', percent: 0, isAlert: false };
}

function detectErrors(status, errorByte, paperStatus) {
    const errors = [];
    const s = parseInt(status);
    const pStatus = parseInt(paperStatus);
    const byte = errorByte?.[0] ?? 0;
    const isFunctional = s === 3 || s === 4;

    if (byte & 64) errors.push('PAPEL ATOLADO');
    if (!isFunctional) {
        if (byte & 32) errors.push('PORTA ABERTA');
        if (byte & 128 || pStatus === 2) errors.push('SEM PAPEL');
    }
    return errors;
}

async function scantermicas(impressora) {
    return new Promise((resolve) => {
        const session = snmp.createSession(impressora.ip, "public", { timeout: 1500, retries: 0 });
        const modelo = impressora.model.toUpperCase();

        if (modelo.includes("I9")) {
            const oids = ["1.3.6.1.2.1.25.3.5.1.1.1", "1.3.6.1.2.1.25.3.5.1.2.1"];
            session.get(oids, (error, varbinds) => {
                if (error) {
                    impressora.status = "offline";
                    impressora.paper = "N/A";
                    impressora.hasError = true;
                    impressora.statusMsg = "OFFLINE";
                } else {
                    const printerStatus = varbinds[0].value;
                    const erroBruto = varbinds[1].value;
                    const detectedError = Buffer.isBuffer(erroBruto) ? erroBruto[0] : erroBruto;

                    impressora.status = (printerStatus === 5) ? "offline" : "online";
                    impressora.paper = (detectedError > 0) ? "VAZIO" : "OK"; 
                    impressora.hasError = (detectedError > 0);
                    impressora.statusMsg = impressora.status === "offline" ? "OFFLINE" : (detectedError > 0 ? "ERRO/SEM PAPEL" : "PRONTA");
                }
                session.close();
                resolve(impressora);
            });
        } 
        else if (modelo.includes("ZD230")) {
            const oids = ["1.3.6.1.4.1.10642.1.1.0", "1.3.6.1.4.1.10642.1.10.0"];
            session.get(oids, (error, varbinds) => {
                if (error) {
                    impressora.status = "offline";
                    impressora.paper = "N/A";
                    impressora.hasError = true;
                    impressora.statusMsg = "OFFLINE";
                } else {
                    const zebraStatus = varbinds[0].value.toString();
                    impressora.status = "online"; 
                    impressora.statusMsg = zebraStatus;
                    impressora.paper = zebraStatus.includes("Out") ? "VAZIO" : "OK";
                    impressora.pageCount = parseInt(varbinds[1]?.value) || 0; 
                    impressora.hasError = !zebraStatus.includes("Ready");
                }
                session.close();
                resolve(impressora);
            });
        } else {
            session.close();
            resolve(impressora);
        }
    });
}

async function scanImpressoras(PRINTERS, OIDS) {
    if (!PRINTERS.length) return [];

    return await Promise.all(PRINTERS.map(async (printer) => {
        if (printer.model.toUpperCase().includes("I9") || printer.model.toUpperCase().includes("ZD230")) {
            return await scantermicas(printer);
        }

        return new Promise(resolve => {
            const session = snmp.createSession(printer.ip, 'public', { timeout: 2500, retries: 1 });
            const isColor = printer.model?.toUpperCase().includes('6270');
            const oidsToGet = isColor ? [...OIDS.toners] : [OIDS.toners[0]];
            oidsToGet.push(OIDS.paperCurrent, OIDS.paperUnitStatus, OIDS.counter, OIDS.status, OIDS.errorState, OIDS.modeloImpre);

            session.get(oidsToGet, (err, varbinds) => {
                session.close();
                if (err) {
                    return resolve({ 
                        ...printer, 
                        status: 'offline', 
                        hasError: true, 
                        errorMessages: ['OFFLINE'],
                        toners: [] ,
						modeloImpre: 'N/A'
                    });
                }
                const tCount = isColor ? 4 : 1;
                const toners = Array.from({ length: tCount }, (_, i) => parseToner(varbinds[i].value));
                const errors = detectErrors(varbinds[tCount+3].value, varbinds[tCount+4].value, varbinds[tCount+1].value);
				let modeloExtraido = 'N/A'
				if (varbinds[tCount+5] && varbinds[tCount+5].value) {
                    modeloExtraido = varbinds[tCount+5].value.toString().trim();
                }

                resolve({
                    ...printer,
                    status: 'online',
                    isColor,
                    toners,
                    paper: (parseInt(varbinds[tCount+1].value) === 0 || parseInt(varbinds[tCount].value) > 0) ? 'OK' : 'VAZIO',
                    pageCount: parseInt(varbinds[tCount+2].value) || 0,
                    errorMessages: errors,
                    hasError: errors.length > 0,
					modeloImpre: modeloExtraido
                });
            });
        });
    }));
}

module.exports = { scanImpressoras };