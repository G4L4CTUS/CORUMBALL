const express = require('express');
const router = express.Router();
const path = require(`path`);
const sqlite3 = require(`sqlite3`).verbose();


const dbPath = path.join(`C:/Users/Corumba/Documents/CORUMBALL/Banco de dados`, `Nobreaks.db`);
const db = new sqlite3.Database(dbPath, (erro)=>{
		if (erro) console.error(`Erro ao se conectar ao banco de dados:` ,erro.message);
		else console.log (`Conexão realizada com sucesso`);
});

db.run( `CREATE TABLE IF NOT EXISTS nobreaks_clientes (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	nome VARCHAR(15) NOT NULL,
	local TEXT NOT NULL,
	desc TEXT,
	data DATETIME DEFAULT (datetime('now', 'localtime'))
)`);
router.get(`/`, (req, res)=>{
	const sql = `SELECT * FROM nobreaks_clientes ORDER BY local DESC`;
	db.all(sql, [], (erro, linhas)=>{
		if (erro){
			return res.json(500).json ({erro: error.message});
		}
		const NobreaksOrganizados = linhas;
		res.json(NobreaksOrganizados);
	});
})
router.post(`/`, (req, res)=>{
	const {nome, local, desc} = req.body;
	const sql = `INSERT INTO nobreaks_clientes (nome, local, desc)
	VALUES(?,?,?)`;
	db.run(sql, [nome, local, desc], function (erro){
		if (erro) {
			console.error(`Erro ao salvar o nobreak:`, erro);
			return res.status(500).json({erro: erro.message});
		}
		res.status(201).json({id: this.lastID, messagem: 'Nobreak Salvo'});
		if (req.app.get('io')) req.app.get('io').emit(`atualizarNobreaksGlobais`)
	});
});
router.put('/:id', (req, res) => {
    const idEdit = req.params.id;
    const { nome, local, desc } = req.body;
    
    const sql = `UPDATE nobreaks_clientes SET nome = ?, local = ?, desc = ? WHERE id = ?`;
    
    db.run(sql, [nome, local, desc, idEdit], function (erro) {
        if (erro) {
            console.error('Erro ao editar o nobreak:', erro);
            return res.status(500).json({ erro: erro.message });
        }
        res.json({ ok: true, editados: this.changes });
		
        if (req.app.get('io')) req.app.get('io').emit('atualizarNobreaksGlobais');
    });
});
router.delete(`/:id`,(req, res)=>{
	const IDdelete = req.params.id
	const sql = `DELETE FROM nobreaks_clientes WHERE id=?`;
	
	db.run(sql, [IDdelete], function(erro){
		if(erro){
			return res.status(500).json ({erro: erro.message});
		}
		res.json({ok: true, deletados: this.changes});
		if (req.app.get('io')) req.app.get('io').emit('atualizarNobreaksGlobais');
	});
});
module.exports = router;