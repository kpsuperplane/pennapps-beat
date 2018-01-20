const musicAPI = require('./../musicAPI');
const Lyric = require('./Lyric');
const Song = require('./Song');
const fs = require('fs');
const searchSpotify = require('./searchSpotify');

function simulateDownload(url, cb){
  let data = fs.readFileSync('./../test/1775613206_1477279482269_7518.xlrc', 'utf8');
  cb(data);
}

function download(url, cb) {
  simulateDownload(url, cb);
  // var data = "";
  // var request = require("http").get(url, function(res) {

  //   res.on('data', function(chunk) {
  //     data += chunk;
  //   });

  //   res.on('end', function() {
  //     cb(data);
  //   })
  // });

  // request.on('error', function(e) {
  //   console.log("Got error: " + e.message);
  // });
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

function deferToSpotify(query){
  searchSpotify(query).then(analysis=>{
    
  })
}

function search(query, artist){
  // musicAPI.searchSong('xiami', {
  //   key: query,
  //   limit: 200,
  //   page: 1,
  //   artist: artist
  // })
  // .then(({songList}) => {
    // console.log(songList);
    return new Promise((resolve, reject)=>{
      let songList = ['', ''];
      download(songList[0].lyric, data => {
        const blacklist = ['x-trans', 'ti:', 'ar:', 'al:', 'by:', 'offset:']
        const lyrics = data.split('\n').filter(line=>{
          return filter(blacklist, line)
        }).map(line=>{
          return line.trim();
        });
        let output = [];
        for(let line of lyrics){
          console.log(line)
          if(line.split(']')[1].length>0)
            output.push(new Lyric(line));
        }
        // console.log(output);
        resolve(output);
      });
    })
  // })
  // .catch(err => console.log(err))
}
module.exports = search