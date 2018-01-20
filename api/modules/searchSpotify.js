require('dotenv').config();
const f = require('node-fetch')

//returns the ID of the song
function _search(query, token){
	let url = "https://api.spotify.com/v1/search?q=";
	let params = {
		headers: {
			'Authorization': token
		}
	}
	return new Promise((resolve, reject)=>{
		f(url+query.replace(' ', '+')+'?type=track').then(res=>{
			if(res.tracks && res.tracks.item[0])
				resolve(res.tracks.items[0].id);
			else
				reject(new Error('Song not found'));
		}).catch(e=>{
			reject(e);
		})
	})
}

//returns a massibe blob of stuff
function getTrackAnalysis(id, token){
	let url = "https://api.spotify.com/v1/audio-analysis/"+id;
	let params = {
		headers: {
			'Authorization': token
		}
	}
	return new Promise((resolve, reject)=>{
		f(url, params).then(result=>{
			resolve(result);
		}).catch(e=>{
			reject(e)
		})
	})

}

//returns the song analysis
function searchSpotify(query){
	return new Promise((resolve, reject)=>{
		authorize().then(token=>{
			_search(query, token).then(songID=>{
				getTrackAnalysis(songID, token).then(analysis=>{
					resolve(analysis)
				}).catch(reject)
			}).catch(reject)
		}).catch(reject)
	})
}

function authorize(){
	let url = "https://accounts.spotify.com/api/token";
	let method = 'POST';
	let auth = new Buffer(process.env.SPOTIFY_ID + ':' + process.env.SPOTIFY_SECRET).toString('base64');
	let headers = {
		'Authorization':'Basic '+ auth
	}
	let body={
		'grant_type': "client_credentials"
	}
	let params ={
		method: method,
		headers: headers,
		body: body
	}
	return new Promise((resolve, reject)=>{
		f(url, params).then(response=>{
			console.log(response);
			resolve(response);
		}).catch(reject);
	}) 
}

module.exports = searchSpotify;
