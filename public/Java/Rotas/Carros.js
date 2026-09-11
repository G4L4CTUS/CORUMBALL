const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const router = express.Router();

const dbPath = path.join('C:/Users/Corumba/Documents/CORUMBALL/Banco de dados', 'frotas.db');
const db = new sqlite3.Database(dbPath, (erro) => {
    if (erro) console.error(`Erro ao conectar:`, erro.message);
    else console.log("📦 Banco de dados SQLite conectado com sucesso");
});

db.run(`CREATE TABLE IF NOT EXISTS carros_checklist (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    placa TEXT NOT NULL,
    motorista TEXT NOT NULL,
    hodometro TEXT,
    tipo TEXT,
    manutencao TEXT,
    obs TEXT,
    batidos TEXT,
    obsbatidas TEXT,
    dataRegistro DATETIME DEFAULT (datetime('now', 'localtime'))
)`);

router.get('/', (req, res) => {
    const sql = `SELECT * FROM carros_checklist ORDER BY id DESC`;
    
    db.all(sql, [], (erro, linhas) => {
        if (erro) {
            return res.status(500).json({ erro: erro.message });
        }
        
        const carrosFormatados = linhas.map(carro => {
            let manutencaoSegura = [];
            let batidosSeguros = [];
            
            try {
                manutencaoSegura = carro.manutencao ? JSON.parse(carro.manutencao) : [];
            } catch (e) {
                console.error(`⚠️ Dado corrompido na manutenção do carro ID: ${carro.id}`);
            }
            
            try {
                batidosSeguros = carro.batidos ? JSON.parse(carro.batidos) : [];
            } catch (e) {
                console.error(`⚠️ Dado corrompido nas batidas do carro ID: ${carro.id}`);
            }
            
            return {
                ...carro,
                manutencao: manutencaoSegura,
                batidos: batidosSeguros
            };
        });
        
        res.json(carrosFormatados);
    });
});


router.post('/', (req, res) => {
    const { placa, motorista, hodometro, tipo, manutencao, obs, batidos, obsbatidas } = req.body;
    
    
    const manutencaoTexto = manutencao ? JSON.stringify(manutencao) : '[]';
    const batidosTexto = batidos ? JSON.stringify(batidos) : '[]';
    
    const sql = `
        INSERT INTO carros_checklist
        (placa, motorista, hodometro, tipo, manutencao, obs, batidos, obsbatidas)
        VALUES(?,?,?,?,?,?,?,?)
    `;
    
 
    db.run(sql, [placa, motorista, hodometro, tipo, manutencaoTexto, obs, batidosTexto, obsbatidas], function (erro) {
        if (erro) {
            console.error('Erro ao salvar no banco de dados:', erro);
            return res.status(500).json({ erro: erro.message });
        }
        res.status(201).json({ id: this.lastID, mensagem: 'Checklist salvo com sucesso' });
    });
});

router.delete('/:id', (req, res) => {
    const IDdelete = req.params.id;
    const sql = `DELETE FROM carros_checklist WHERE id = ?`;
    
    db.run(sql, [IDdelete], function(erro) {
        if (erro) {
            return res.status(500).json({ erro: erro.message });
        }
        res.json({ ok: true, deletados: this.changes });
    });
});

module.exports = router;