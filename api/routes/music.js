var express = require('express');
var router = express.Router();

const xiamiSearch = require('./../modules/search')

/* GET music endpoint. */
router.get('/', function(req, res, next) {
	res.setHeader('Content-Type', 'application/json');
	xiamiSearch(req.query.title, req.query.artist).then(data=>{
		console.log('===== RETURN TO SENDER =====')
		console.log(data)
		res.send(JSON.stringify(data))
	}).catch(e=>{
		console.error(e);
		res.send(JSON.stringify(e))

	})
});


module.exports = router;
