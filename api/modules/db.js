require('dotenv').config();
var MongoClient = require('mongodb').MongoClient;
var url = process.env.DB;
let db = {dbo: null};
module.exports = (cb) => {
    MongoClient.connect(url, function(err, db) {
        if (err) throw err;
        cb(db.db('admin'), db);
    });
}