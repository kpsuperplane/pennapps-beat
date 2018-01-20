const musicAPI = require('./musicAPI');
const Lyric = require('./Lyric');
const fs = require('fs');

function write(data){
  fs.writeFile("./test/lyrics.data", data, function(err) {
    if(err) {
      return console.log(err);
    }
    console.log("The file was saved!");
  }); 
}

function simulateDownload(url, cb){
  let data = fs.readFileSync('./test/1775613206_1477279482269_7518.xlrc', 'utf8');
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

// musicAPI.searchSong('xiami', {
//   key: process.argv[2],
//   limit: 200,
//   page: 1,
//   artist: process.argv[3]
// })
// .then(({songList}) => {
  // console.log(songList);
  let songList = ['', ''];
  download(songList[0].lyric, data => {
    // write(data);
    //
    // console.log(data);
    const blacklist = ['x-trans', 'ti:', 'ar:', 'al:', 'by:', 'offset:']
    const lyrics = data.split('\n').filter(line=>{
      console.log(line);
      console.log(filter(blacklist, line));
      return filter(blacklist, line)
    });
    let output = [];
    for(let line of lyrics){
      console.log(line);
      output.push(new Lyric(line));
    }
    console.log(output);
  });
// })
// .catch(err => console.log(err))
