
const musicAPI = require('./../musicAPI');
const Lyric = require('./Lyric');
const Song = require('./Song');
const fs = require('fs');
const searchSpotify = require('./searchSpotify');
const connectDb = require('./db');

function simulateDownload(url, cb){
  let data = fs.readFileSync('../api/test/1775613206_1477279482269_7518.xlrc', 'utf8');
  cb(data);
}

function download(url, cb) {
   var data = "";
 var request = require("http").get(url, function(res) {

     res.on('data', function(chunk) {
       data += chunk;
     });

   res.on('end', function() {
       cb(data);
     })
   });

   request.on('error', function(e) {
     console.log("Got error: " + e.message);
   });
}

function filter(blacklist, string){
  // let acceptable
  for(let f in blacklist){
    // console.log(blacklist[f]);
    if(string.indexOf(blacklist[f]) !== -1)
      return false;
  }
  return true;
}
function parseMetadata(song, artist){
  let metadata = {
    'artist': song.artists[0].name,
    'title': song.name,
    'rawLyrics': song.lyrics
  };
  if(song.artists[0].name === 'Various Artists'){
    metadata.artist = artist;
  }
  return metadata;
}

function deferToSpotify(query, song){
  return new Promise((resolve, reject)=>{
    searchSpotify(query).then(analysis=>{
      resolve(song.addAnalysis(analysis))
    }).catch(e=>{
      console.error(e);
      reject(e);
    })
  })
}

function fetch(query, artist){
   return musicAPI.searchSong('xiami', {
     key: query,
     limit: 100,
     page: 1,
     artist: artist
   })
   .then(({songList}) => {
    // console.log(songList);
    //let songList = [{artists: [{name: 'Alan Walker'}], name: 'Faded', lyric: 'http://example.com'}];
    return new Promise((resolve, reject)=>{
      let song = new Song(parseMetadata(songList[0], artist))
      download(songList[0].lyric, data => {
        const blacklist = ['x-trans', 'ti:', 'ar:', 'al:', 'by:', 'offset:']
        
        const lyrics = data.split('\n').filter(line=>{
          return filter(blacklist, line)
        }).map(line=>{
          return line.trim();
        });

        for(let line of lyrics){
          if (line.indexOf(']') != -1) {
          if(line.split(']')[1].length>0)
            song.lyrics.push(new Lyric(line));
          }
        }

        deferToSpotify(query+"+"+artist, song).then(updatedSong=>{
          connectDb((dbo, db) => {
            dbo.collection("songs").insertOne(updatedSong, function(err, res) {
              if (err) throw err;
              db.close();
              resolve(updatedSong);
            });
          });
        }).catch(e=>{
          reject(e);
        })
        // console.log(output)
      });
    })
  })
  .catch(err => console.log(err))
}
module.exports = {
  fetch: fetch,
  search: function(query) {
    return new Promise((resolve) => {
      connectDb((dbo, db) => {
        dbo.collection("songs").find({$text: {$search: query}}).toArray(function(err, result) {
          db.close();
          resolve(result);
        });
      });
    });
  },
  all: function() {
    return new Promise((resolve) => {
      connectDb((dbo, db) => {
        dbo.collection("songs").find({}).project({ _id : 1, title : 1, artist: 1 }).toArray(function(err, results) {
          db.close();
          resolve(results);
        });
      });
    });
  }
};