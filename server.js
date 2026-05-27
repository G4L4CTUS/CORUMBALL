const express    = require('express');
const http       = require('http');
const { Server } = require('socket.io');
const fs         = require('fs');
const path       = require('path');

// ── Importação dos Módulos Especialistas ──────────────────────────────────────
const printerScanner = require('./modules/printerScanner');
const infraScanner   = require('./modules/infraScanner');
const tacticalScanner = require('./modules/tacticalScanner');

// ── Inicialização ─────────────────────────────────────────────────────────────

const app    = express();
const server = http.createServer(app);
const io     = new Server(server);
const PORT   = process.env.PORT || 3000;

const basicAuth = require('express-basic-auth');
require('dotenv').config();
app.use(basicAuth({
    users: { [process.env.CORUMBA_USER]: process.env.CORUMBA_PASS },
    challenge: true,
    realm: 'Corumba soluções em T.I. - Area Restrita',
    unauthorizedResponse: 'Acesso negado. Credenciais incorretas.'
}));

app.use(express.json());
app.use(express.static('public'));

// ── Banco de Dados Local JSON ──────────────────────────────────────────────────

const PRINTERS_FILE = path.join(__dirname, 'printers-config.json');
let PRINTERS = [];
try { PRINTERS = JSON.parse(fs.readFileSync(PRINTERS_FILE, 'utf8')); } catch { fs.writeFileSync(PRINTERS_FILE, '[]'); }

const RECADOS_FILE = path.join(__dirname, `recados-config.json`);
let RECADOS=[];
try{ RECADOS = JSON.parse(fs.readFileSync(RECADOS_FILE, `utf8`)); } catch{ fs.writeFileSync(RECADOS_FILE, `[]`); }

const INFRA_FILE = path.join(__dirname, 'infra-config.json');
let INFRA = fs.existsSync(INFRA_FILE) ? JSON.parse(fs.readFileSync(INFRA_FILE, 'utf8')) : [];

// ── Parâmetros Globais SNMP e API ──────────────────────────────────────────────

const OIDS = {
    toners: [
        '1.3.6.1.2.1.43.11.1.1.9.1.1', '1.3.6.1.2.1.43.11.1.1.9.1.2', 
        '1.3.6.1.2.1.43.11.1.1.9.1.3', '1.3.6.1.2.1.43.11.1.1.9.1.4'  
    ],
    paperCurrent:    '1.3.6.1.2.1.43.8.2.1.10.1.1',
    paperUnitStatus: '1.3.6.1.2.1.43.8.2.1.11.1.1',
    counter:         '1.3.6.1.2.1.43.10.2.1.4.1.1',
    status:          '1.3.6.1.2.1.25.3.5.1.1.1',
    errorState:      '1.3.6.1.2.1.25.3.5.1.2.1'
};
const OID_VERSAO = "1.3.6.1.2.1.1.1.0";

const TACTICAL_URL = process.env.TACTICAL_URL;
const TACTICAL_API_KEY = process.env.TACTICAL_API_KEY;

// ── Funções de Execução dos Loops Assíncronos (Maestro) ────────────────────────

async function rodarScanImpressoras() {
    const copiaLimpaPrinters = JSON.parse(JSON.stringify(PRINTERS));
    const results = await printerScanner.scanImpressoras(copiaLimpaPrinters, OIDS);
    if (results && results.length) io.emit('printerUpdate', results);
}

async function rodarScanInfra() {
    const resultados = await infraScanner.monitorarEqps(INFRA, OID_VERSAO);
    resultados.forEach(dados => {
        if (dados) io.emit('infraStatusUpdate', dados);
    });
}

async function scanComputadores() {
    const computadoresOrdenados = await tacticalScanner.scanComputadores(TACTICAL_URL, TACTICAL_API_KEY);
    if (computadoresOrdenados) {
        io.emit('computerUpdate', computadoresOrdenados);
    }
}

// ── Loops e Inicialização das Instâncias ──────────────────────────────────────

setInterval(rodarScanImpressoras, 4000);
setInterval(scanComputadores, 15000);
setInterval(rodarScanInfra, 5000);

// Primeira chamada manual ao iniciar o servidor
scanComputadores();

io.on('connection', (socket) => {
    console.log('🔌 Novo cliente conectado');
    socket.emit('printerUpdate', PRINTERS); 
    socket.emit('recadosUpdate', RECADOS);   
    scanComputadores(); 
});

// ── Rotas REST API ────────────────────────────────────────────────────────────

app.get('/api/infra', (req, res) => res.json(INFRA));

app.post('/api/infra', (req, res) => {
    const novoEq = { id: Date.now(), ...req.body };
    INFRA.push(novoEq);
    fs.writeFileSync(INFRA_FILE, JSON.stringify(INFRA, null, 2));
    res.status(201).json(novoEq);
});

app.delete('/api/infra/:id', (req, res) => {
    INFRA = INFRA.filter(eq => eq.id != req.params.id);
    fs.writeFileSync(INFRA_FILE, JSON.stringify(INFRA, null, 2));
    res.json({ ok: true });
});

app.put('/api/infra/porta', (req, res) => {
    const { eqId, portaNum, descricao, cor } = req.body;
    const eq = INFRA.find(e => e.id == eqId);
    if (eq) {
        if (!eq.dadosPortas) eq.dadosPortas = {};
        eq.dadosPortas[portaNum] = { descricao, cor };
        fs.writeFileSync(INFRA_FILE, JSON.stringify(INFRA, null, 2));
    }
    res.json({ ok: true });
});

app.post('/api/printers', (req, res) => {
    const { unit, name, ip, model } = req.body;
    if (!unit || !name || !ip || !model) return res.status(400).json({ erro: 'Campos obrigatórios' });
    const nova = { id: Date.now(), unit: unit.toUpperCase(), name, ip, model };
    PRINTERS.push(nova);
    fs.writeFileSync(PRINTERS_FILE, JSON.stringify(PRINTERS, null, 2));
    res.status(201).json(nova);
});

app.delete('/api/printers/:id', (req, res) => {
    PRINTERS = PRINTERS.filter(p => p.id != req.params.id);
    fs.writeFileSync(PRINTERS_FILE, JSON.stringify(PRINTERS, null, 2));
    res.json({ ok: true });
});

app.get('/api/status', (_req, res) => res.json({
    ok: true,
    impressoras: PRINTERS.length,
    uptime: Math.floor(process.uptime()) + 's'
}));

app.get(`/api/recados`, (req, res) => res.json(RECADOS));

app.post(`/api/recados`, (req, res) => {
    const { titulo, mensagem, urgente, autor, data } = req.body;
    if (!titulo || !mensagem) return res.status(400).json({ error: `Titulo e mensagem são obrigatórios` });
    
    const novoRecado = {
        id: Date.now(), 
        titulo,
        mensagem,
        urgente: urgente || false,
        autor: autor || 'Sistema',
        data: data || new Date().toISOString()
    };
    RECADOS.unshift(novoRecado);
    RECADOS.sort((a, b) => (a.urgente === b.urgente) ? 0 : a.urgente ? -1 : 1);
    if (RECADOS.length > 50) RECADOS.pop();
    fs.writeFileSync(RECADOS_FILE, JSON.stringify(RECADOS, null, 2));
    io.emit(`recadosUpdate`, RECADOS);
    res.status(201).json(novoRecado);
});

app.delete(`/api/recados/:id`, (req, res) => {
    RECADOS = RECADOS.filter(r => r.id != req.params.id);
    fs.writeFileSync(RECADOS_FILE, JSON.stringify(RECADOS, null, 2));
    io.emit(`recadosUpdate`, RECADOS);
    res.json({ ok: true });
});

// ── Inicialização do Servidor ─────────────────────────────────────────────────

server.listen(PORT, () => {
    console.log(`\n🚀 Servidor 100% MODULAR pronto: http://localhost:${PORT}`);
    console.log(`📡 Monitoramento isolado via sub-módulos ativo!\n`);
});