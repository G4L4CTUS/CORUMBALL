const express = require('express'); 
const router = express.Router();
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const dbPath = path.join(process.cwd(), 'Banco de dados', 'Impressoras.db');
const db = new sqlite3.Database(dbPath, (erro) => {
    if (erro) console.error('Não foi possível se conectar ao banco de dados');
    else console.log('📦 Conexão com o banco de Impressoras realizada com sucesso');
});

db.run(`CREATE TABLE IF NOT EXISTS Impressoras_clientes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    unidade TEXT NOT NULL,
    setor TEXT,
    endereco TEXT NOT NULL,
    modelo TEXT
)`);

router.get('/', (req, res) => {
    const sql = 'SELECT * FROM Impressoras_clientes';
    db.all(sql, [], (err, linhas) => {
        if (err) return res.status(500).json({ error: err.message });
        
        const Impressoras_organizadas = linhas.map(linha => ({
            id: linha.id,
            unit: linha.unidade,
            name: linha.setor,
            ip: linha.endereco,
            model: linha.modelo
        }));
        
        res.json(Impressoras_organizadas);
    });
});

router.post('/', (req, res) => {

    const { unidade, setor, endereco, modelo } = req.body;
    const sql = `INSERT INTO Impressoras_clientes (unidade, setor, endereco, modelo) VALUES(?,?,?,?)`;

    db.run(sql, [unidade, setor, endereco, modelo], function (erro) {
        if (erro) {
            console.error('Erro ao salvar impressora:', erro);
            return res.status(500).json({ erro: erro.message });
        }
        res.status(201).json({ id: this.lastID, mensagem: 'Impressora salva' });
        
        if (req.app.get('io')) req.app.get('io').emit('atualizarImpressorasGlobais');
    });
});

router.put('/:id', (req, res) => {
    const idEdit = req.params.id;
    const { unidade, setor, endereco, modelo } = req.body;
    
    const sql = `UPDATE Impressoras_clientes SET unidade = ?, setor = ?, endereco = ?, modelo = ? WHERE id = ?`;
    
    db.run(sql, [unidade, setor, endereco, modelo, idEdit], function (erro) {
        if (erro) {
            console.error('Erro ao editar a impressora:', erro);
            return res.status(500).json({ erro: erro.message });
        }
        res.json({ ok: true, editados: this.changes });
        
        if (req.app.get('io')) req.app.get('io').emit('atualizarImpressorasGlobais');
    });
});

router.delete('/:id', (req, res) => {
    const IDdelete = req.params.id;
    const sql = `DELETE FROM Impressoras_clientes WHERE id = ?`;
    
    db.run(sql, [IDdelete], function (erro) {
        if (erro) {
            return res.status(500).json({ erro: erro.message });
        }
        res.json({ ok: true, deletados: this.changes });
        
        if (req.app.get('io')) req.app.get('io').emit('atualizarImpressorasGlobais');
    });
});

module.exports = router;