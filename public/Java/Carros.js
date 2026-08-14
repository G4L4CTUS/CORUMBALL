const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();

const CARROS_FILE = path.join(__dirname, 'carros-config.json');
function lerCarros(){
	try{
		return JSON.parse(fs.readFileSync(CARROS_FILE, 'utf8'));
} catch {
	return[];
}
}
router.get('/',(req, res)=>{
	const carros = lerCarros();
	res.json(carros);
});
router.post('/', (req, res)=>{
	const carros = lerCarros();
	const novoRelatorio = {
		id: Date.now(),
		dataRegistro: new Date().toLocaleString('pt-BR'),
		...req.body
};
carros.unshift(novoRelatorio);
fs.writeFileSync(CARROS_FILE, JSON.stringify(carros, null, 2));
res.status(201).json(novoRelatorio);
});

router.delete('/:id', (req, res) => {
	let carros = lerCarros();
	carros = carros.filter(c => c.id != req.params.id);
	fs.writeFileSync(CARROS_FILE, JSON.stringify(carros, null, 2));
	res.json({ok: true});
});

module.exports = router;