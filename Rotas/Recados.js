const express = require('express');
const router = express.Router();
const sqlite3 = require ('sqlite3').verbose();
const path = require('path');

const dbPath = path.join (process.cwd(), 'Banco de dados', 'Recados.db');
const db = new sqlite3.Database(dbPath, (erro)=>{
	if (erro) console.error ('Erro ao se conectar ao banco de dados:', erro.message);
	else console.log ('Conexão realizada com sucesso');
});

db.run (`CREATE TABLE IF NOT EXISTS Recados (
	 id INTEGER PRIMARY KEY AUTOINCREMENT,
	 titulo TEXT NOT NULL,
	 mensagem TEXT NOT NULL,
	 urgente TEXT,
	 autor TEXT NOT NULL,
	 data DATETIME DEFAULT (datetime('now', 'localtime')) 
	)` );
	
router.get('/', (req, res) =>{
	const sql = `SELECT * FROM Recados ORDER BY id DESC`;
	db.all(sql, [], (erro, linhas)=>{
		if (erro){
			return res.status (500).json ({erro: erro.message});
		}
		const recadosOrganizados = linhas.map(recado =>{
			return{
				...recado,
				urgente: recado.urgente === 'true'
			};
		});
		res.json(recadosOrganizados);
	});
});
router.post('/', (req, res)=>{
	const {titulo, mensagem, urgente, autor} = req.body;
	const urgenteTexto = urgente ? 'true': 'false';
	
	const sql = `INSERT INTO Recados (titulo, mensagem, urgente, autor)
	VALUES(?,?,?,?)`;
	
	db.run(sql, [titulo, mensagem, urgenteTexto, autor], function (erro){
		if (erro) {
			console.error('Erro ao salvar no banco de dados:', erro);
			return res.status(500).json({erro: erro.message});
		}
		res.status(201).json({id: this.lastID, mesagem: 'Recado salvo'});
	});
});
router.delete('/:id', (req, res)=>{
	const IDdelete = req.params.id;
	const sql = `DELETE FROM Recados WHERE id = ?`;
	
	db.run(sql, [IDdelete], function(erro){
		if(erro){
			return res.status(500).json({erro: erro.message});
		}
		res.json({ok: true, deletados: this.changes});
	});
});
module.exports = router;