const express    = require('express');
const http       = require('http');
const { Server } = require('socket.io');
const fs         = require('fs');
const path       = require('path');
const dns        = require('dns').promises
const {Client, LocalAuth} = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

// ── Importação dos Módulos Especialistas ──────────────────────────────────────
const printerScanner = require('./modules/printerScanner');
const infraScanner   = require('./modules/infraScanner');
const tacticalScanner = require('./modules/tacticalScanner');


// ── Inicialização ─────────────────────────────────────────────────────────────

const app    = express();
const server = http.createServer(app);
const io     = new Server(server);
const PORT   = process.env.PORT || 3000;

app.set('io', io);

const basicAuth = require('express-basic-auth');
require('dotenv').config();
	if (!process.env.CORUMBA_USER || !process.env.CORUMBA_PASS){
		console.error(`\n======================================================================================`);
		console.error(`Sem usuário e senha definidos`);
		console.error(`defina eles dentro do .env como: CORUMBA_USER e CORUMBA_PASS`)
		process.exit(1);
	};

app.use(basicAuth({
    users: { [process.env.CORUMBA_USER]: process.env.CORUMBA_PASS },
    challenge: true,
    realm: 'Corumba soluções em T.I. - Area Restrita',
    unauthorizedResponse: 'Acesso negado. Credenciais incorretas.'
}));

app.use(express.json());
app.use(express.static('public'));

// ── Banco de Dados Local JSON ──────────────────────────────────────────────────
const ATENDIMENTOS_FILE = path.join(__dirname, 'atendimentos-config.json');
let ATENDIMENTOS = [];
try { 
    ATENDIMENTOS = JSON.parse(fs.readFileSync(ATENDIMENTOS_FILE, 'utf8')); 
} catch { 
    fs.writeFileSync(ATENDIMENTOS_FILE, '[]'); 
}

const PRINTERS_FILE = path.join(__dirname, 'printers-config.json');
let PRINTERS = [];
try { PRINTERS = JSON.parse(fs.readFileSync(PRINTERS_FILE, 'utf8')); } catch { fs.writeFileSync(PRINTERS_FILE, '[]'); }

const INFRA_FILE = path.join(__dirname, 'infra-config.json');
let INFRA = fs.existsSync(INFRA_FILE) ? JSON.parse(fs.readFileSync(INFRA_FILE, 'utf8')) : [];

const CONTATOS_FILE = path.join(__dirname, 'contatos-config.json');
let CONTATOS = fs.existsSync(CONTATOS_FILE) ? JSON.parse(fs.readFileSync(CONTATOS_FILE, 'utf8')) : [];

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
    errorState:      '1.3.6.1.2.1.25.3.5.1.2.1',
	modeloImpre:	'1.3.6.1.2.1.25.3.2.1.3.1'
};
const OID_VERSAO = "1.3.6.1.2.1.1.1.0";

const TACTICAL_URL = process.env.TACTICAL_URL;
const TACTICAL_API_KEY = process.env.TACTICAL_API_KEY;

// ── Funções de Execução dos Loops Assíncronos (Maestro) ────────────────────────

async function rodarScanImpressoras() {
    const copiaLimpaPrinters = JSON.parse(JSON.stringify(PRINTERS));

    for (let printer of copiaLimpaPrinters) {
        if (printer.ip && /[a-zA-Z]/.test(printer.ip)) {
            try {
                const lookup = await dns.lookup(printer.ip);
                printer.ip = lookup.address; 
            } catch (err) {
                printer.ip = '0.0.0.0'; 
            }
        }
    }
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
    const resultado = await tacticalScanner.scanComputadores(TACTICAL_URL, TACTICAL_API_KEY);
	if (resultado) {
		if(resultado.erro === true){
			io.emit(`computerError`, resultado);
		} else {
			io.emit(`computerUpdate`, resultado);
		}
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
    scanComputadores(); 
	socket.emit(`atendimentosUpdate`, ATENDIMENTOS.filter(a=>!a.finalizado));
});

// ─────────────whatsapp web───────────────────────────────────────────────
console.log('Iniciando o zap zap');
const wppClient = new Client({authStrategy: new LocalAuth()});
wppClient.on('qr', (qr)=>{
	console.log('\n Scaneie o qr code para conectar e ativar notificações via zap zap');
	qrcode.generate(qr, {small: true});
});
wppClient.on('ready', ()=>{
	console.log('zap zap conectado')
});
wppClient.initialize();
async function enviarNoti(numero, mensagem){
	if (!numero) return;
	try {
		let numeroLimpo = numero.replace(/\D/g, '');
		if (!numeroLimpo.startsWith('55')){
			numeroLimpo = '55' + numeroLimpo;
		}
		const chatId = `${numeroLimpo}@c.us`;
		await wppClient.sendMessage(chatId, mensagem);
		console.log(`Notificação enviada com sucesso para: ${numeroLimpo}`);
	} catch (erro) {console.error('Erro ao enviar a notificação:', erro.message);
	}
}


// ── Rotas REST API ────────────────────────────────────────────────────────────

const rotasCarros = require('./public/Java/Rotas/Carros');
app.use('/api/carros', rotasCarros);

const rotasRecados = require('./public/Java/Rotas/Recados');
app.use('/api/recados', rotasRecados);

const rotasNobreaks = require('./public/Java/Rotas/Nobreaks');
app.use('/api/nobreaks', rotasNobreaks);

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
app.get('/api/atendimentos', (req, res) => {
    const {status} = req.query;
	if(status===`finalizados` || status === `finalizado`){
		return res.json(ATENDIMENTOS.filter(a=>a.finalizado));
	}
	res.json(ATENDIMENTOS.filter(a=>!a.finalizado));
});

app.post('/api/atendimentos', (req, res) => {
    const { NomeAtendimento, Local, RtdEqp, DataChegada, descricaoAtd, numeroWpp } = req.body;
    if (!NomeAtendimento || !Local || !DataChegada || !descricaoAtd) {
        return res.status(400).json({ error: "Todos os campos são obrigatórios" });
    }
    const Novo_Atendimento = {
        id: Date.now(),
        nome: NomeAtendimento,
        local: Local,
        retirado: RtdEqp || false,
        dataChegada: DataChegada,
        descricao: descricaoAtd,
        finalizado: false,        
        dataFinalizado: null,    
        resolucao: null
    };

    ATENDIMENTOS.unshift(Novo_Atendimento);
    ATENDIMENTOS.sort((a, b) => (a.retirado === b.retirado) ? 0 : a.retirado ? -1 : 1);
    
    fs.writeFileSync(ATENDIMENTOS_FILE, JSON.stringify(ATENDIMENTOS, null, 2));
    io.emit('atendimentosUpdate', ATENDIMENTOS.filter(a => !a.finalizado));
 
	if (numeroWpp) {
        const textoAlerta = `🛠️ *NOVO CHAMADO DE T.I.*\n\n🖥️ *Motivo:* ${NomeAtendimento}\n📍 *Local:* ${Local}\n📄 *Detalhes:* ${descricaoAtd}`;
        enviarNoti(numeroWpp, textoAlerta);
    }
    res.status(201).json(Novo_Atendimento);
});
app.put('/api/atendimentos/:id/finalizar', (req, res) => {
    const { resolucao } = req.body;
    if (!resolucao) return res.status(400).json({ error: "A resolução é obrigatória" });

    const atd = ATENDIMENTOS.find(a => a.id == req.params.id);
    if (!atd) return res.status(404).json({ error: "Atendimento não encontrado" });

    atd.finalizado = true;
    atd.dataFinalizado = Date.now();
    atd.resolucao = resolucao;

    fs.writeFileSync(ATENDIMENTOS_FILE, JSON.stringify(ATENDIMENTOS, null, 2));
    io.emit('atendimentosUpdate', ATENDIMENTOS.filter(a => !a.finalizado));
    res.json({ ok: true });
});
app.delete('/api/atendimentos/:id', (req, res) => {
    ATENDIMENTOS = ATENDIMENTOS.filter(a => a.id != req.params.id);
    fs.writeFileSync(ATENDIMENTOS_FILE, JSON.stringify(ATENDIMENTOS, null, 2));
    io.emit('atendimentosUpdate', ATENDIMENTOS.filter(a => !a.finalizado));
    res.json({ ok: true });
});
app.get('/api/contatos',(req, res) => res.json(CONTATOS));

app.post('/api/contatos', (req, res) => {
	const {nome, numero} = req.body;
	if (!nome || !numero) return res.status(400).json({error: 'Nome e número são obrigatórios'});
	
	const novoContato = {id: Date.now(), nome, numero};
	CONTATOS.push(novoContato);
	fs.writeFileSync(CONTATOS_FILE, JSON.stringify(CONTATOS, null, 2));
	res.status(201).json(novoContato);
});
app.delete('/api/contatos/:id',(req,res)=>{
	CONTATOS = CONTATOS.filter(c => c.id != req.params.id);
	fs.writeFileSync(CONTATOS_FILE, JSON.stringify(CONTATOS, null, 2));
	res.json({ok: true});
});


setInterval(() => {
    const SETE_DIAS_EM_MS = 7 * 24 * 60 * 60 * 1000; 
    const agora = Date.now();
    const totalAntes = ATENDIMENTOS.length;
    ATENDIMENTOS = ATENDIMENTOS.filter(atd => {
        if (!atd.finalizado) return true; 
        return (agora - atd.dataFinalizado) < SETE_DIAS_EM_MS; 
    });
    if (ATENDIMENTOS.length !== totalAntes) {
        console.log(`🧹 Faxina JSON: ${totalAntes - ATENDIMENTOS.length} chamados antigos expurgados.`);
        fs.writeFileSync(ATENDIMENTOS_FILE, JSON.stringify(ATENDIMENTOS, null, 2));
    }
}, 60 * 60 * 1000); 
server.listen(PORT, () => {
    console.log(`\nServidor voando e pronto: http://localhost:${PORT}`);
    console.log(`Rodando normalmente\n`);
});