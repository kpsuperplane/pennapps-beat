const fs = require('fs')
const fetch = require('node-fetch')
var items = [{"song":"Love Yourself","artist":"Justin Bieber"}]
function loadFromFile(){
	let data = fs.readFileSync('./test/songs.data', 'utf8')
	let songs = data.split('\n')
	for(let index in songs){
		let song = songs[index].trim()
		let pair = song.split('-----')
		let artist = pair[0]
		let title = pair[1].slice(1, -1);
		items.push({"song": title, "artist":artist});
		console.log('parsed: '+title)
	}
}

function httpGet(theUrl)
{
	fetch(theUrl).then(response=>{
		return response.json()
	}).then(json=>{
		console.log('found: '+json.title)
	})
	// var xmlHttp = new XMLHttpRequest();
 //    xmlHttp.open( "GET", theUrl, false ); // false for synchronous request
 //    xmlHttp.send( null );
 //    console.log(xmlHttp.responseText)
 //    return xmlHttp.responseText;
}

loadFromFile()
let index = -1;
// setInterval(() => {
	++index;
	if (index >= items.length) console.log('Done!');
	else httpGet('http://35.182.242.23:3000/music/fetch?title=' + encodeURIComponent(items[index].song) + '&artist=' + encodeURIComponent(items[index].artist));
// }, 10000);