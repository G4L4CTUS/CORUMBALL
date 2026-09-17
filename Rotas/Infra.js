const express = require('express');
const router = express.Router();
const path = require('path');
const sqlite3 = require ('sqlite3').verbose();

const dbPath = path.join(process.cwd(), 'Banco de dados', 'Infra.db');
const db = new sqlite3.Database(dbPath, (erro)=>{
	if (erro) console.error("Não foi possível fazer a conexão com o banco de dados: Infra")
	else console.log("Banco de dados Conectado com sucesso: Infra.")
});
db.serialize(() =>{
db.run(`PRAGMA foreign_KEYS = ON`);

db.run(` CREATE TABLE IF NOT EXISTS Equipamentos(
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	nome TEXT NOT NULL,
	ip TEXT,
	tipo TEXT,
	portas INTEGER
)`);

db.run(`CREATE TABLE IF NOT EXISTS Portas(
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	equipamento_id INTEGER,
	numero_porta INTEGER,
	descricao TEXT,
	status TEXT,
	FOREIGN KEY (equipamento_id) REFERENCES Equipamentos(id) ON DELETE CASCADE
)`);

});
router.get(`/`, (req, res)=>{
		const sql = `SELECT * FROM Equipamentos ORDER BY nome`;
		db.all (sql, [], (erroEq, linhaEq)=>{
		if (erroEq) return res.status(500).json({erro: erroEq.message});
		db.all(`SELECT * FROM Portas`, [], (erroPortas, linhaPortas)=>{
			if (erroPortas) return res.status(500).json({erro: erroPortas.message})
			const Equipamentos_organizados = linhaEq.map(eq=>{
				const portasDoEquipamento = linhaPortas.filter(p=>p.equipamento_id===eq.id)
				const dadosPortas={};
				portasDoEquipamento.forEach(p=>{
					dadosPortas[p.numero_porta]={
						descricao:p.descricao,
						status: p.status
					};
				});
				return{
					id:eq.id,
					nome:eq.nome,
					ip:eq.ip,
					tipo:eq.tipo,
					portas:eq.portas,
					dadosPortas:dadosPortas
				};
			});
			res.json(Equipamentos_organizados);
		});
	});
});
router.post(`/`, (req, res)=>{
	const {nome, ip, tipo, portas} = req.body;
	const sql = `INSERT INTO Equipamentos (nome, ip, tipo, portas) VALUES (?,?,?,?)`;
	db.run(sql, [nome, ip, tipo, portas], function(erro){
		if (erro) {
			console.error('Erro ao salvar ao salvar equipamento', erro);
			return res.status(500).json({erro: erro.message});
		}
		const novoEquipamento = {
			id: this.lastID,
            nome: nome,
            ip: ip,
            tipo: tipo,
            portas: portas,
            dadosPortas: {}
		};
		res.status(201).json(novoEquipamento);
		if (req.app.get ('io')) req.app.get('io').emit('AtualizarEquipamentos');
	});
});

router.put(`/porta`, (req, res) => {
    const eqId = parseInt(req.body.eqId, 10);
    const portaNum = parseInt(req.body.portaNum, 10);
    const { descricao, status } = req.body;
    
    const sqlBusca = `SELECT * FROM Portas WHERE equipamento_id = ? AND numero_porta = ?`;
    
    db.get(sqlBusca, [eqId, portaNum], (erro, portaExiste) => {
        if (erro) return res.status(500).json({ erro: erro.message });
        
        if (portaExiste) {
            const sqlUpdate = `UPDATE Portas SET descricao = ?, status = ? WHERE id = ?`;
            db.run(sqlUpdate, [descricao, status, portaExiste.id], function(err) {
                if (err) return res.status(500).json({ erro: err.message });
                res.json({ ok: true });
                if (req.app.get('io')) req.app.get('io').emit('AtualizarEquipamentos');
            });
        } else {
            const sqlInsert = `INSERT INTO Portas (equipamento_id, numero_porta, descricao, status) VALUES (?,?,?,?)`;
            db.run(sqlInsert, [eqId, portaNum, descricao, status], function(erroInsert) {
                if (erroInsert) return res.status(500).json({ erro: erroInsert.message });
                res.json({ ok: true });
                if (req.app.get('io')) req.app.get('io').emit('AtualizarEquipamentos');
            });
        }
    });
});

router.put(`/:id`, (req, res) =>{
	const IdEdit = req.params.id;
	const {nome, ip, tipo, portas} = req.body;
	
	const sql = `UPDATE Equipamentos SET nome=?, ip=?, tipo =?, portas = ? WHERE id = ?`;
	db.run(sql, [nome, ip, tipo, portas, IdEdit], function(erro){
		if (erro){
			console.error(`Erro ao atualizar o equipamento`, erro.message);
			return res.status(500).json({erro: erro.message});
		}
		res.json({ok: true, editados: this.changes});
		if (req.app.get('io')) req.app.get('io').emit('AtualizarEquipamentos');
	});
});

router.delete(`/:id`, (req,res)=>{
	const idDelete = req.params.id;
	const sql = `DELETE FROM Equipamentos WHERE id = ?`;
	
	db.run(sql, [idDelete], function(erro){
		if(erro){
		console.error(`Erro ao deletar o equipamento`, erro)
		return res.status(500).json({erro: erro.message})
		}
		res.json({ok: true, deletados: this.changes});
		if (req.app.get('io')) req.app.get('io').emit('AtualizarEquipamentos');
	});
});
module.exports = router;