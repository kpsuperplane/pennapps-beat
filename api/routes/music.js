var express = require('express');
var router = express.Router();

const xiamiSearch = require('./../modules/search')

/* GET music endpoint. */
router.get('/', function(req, res, next) {
	res.setHeader('Content-Type', 'application/json');
	xiamiSearch(req.query.title, req.query.artist).then(data=>{
		res.send(JSON.stringify(data))
	})
});


module.exports = router;
