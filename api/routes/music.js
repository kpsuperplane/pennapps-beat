var express = require('express');
var router = express.Router();

const {fetch, search, all} = require('./../modules/search')

router.get('/fetch', function(req, res, next) {
	res.setHeader('Content-Type', 'application/json');
	fetch(req.query.title, req.query.artist).then(data=>{
		res.send(JSON.stringify(data))
	}).catch(e=>{
		console.error(e);
		res.send(JSON.stringify(e))

	})
});

/* GET music endpoint. */
router.get('/search', function(req, res, next) {
	res.setHeader('Content-Type', 'application/json');
	search(req.query.q).then(data=>{
		res.send(JSON.stringify(data))
	}).catch(e=>{
		console.error(e);
		res.send(JSON.stringify(e))

	})
});

/* GET music endpoint. */
router.get('/', function(req, res, next) {
	res.setHeader('Content-Type', 'application/json');
	all().then(data=>{
		res.send(JSON.stringify(data))
	}).catch(e=>{
		console.error(e);
		res.send(JSON.stringify(e))

	})
});


module.exports = router;
