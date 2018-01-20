require('dotenv').config();
const f = require('node-fetch')

//returns the ID of the song
function _search(query, token){
	console.log('query: '+query)
	let url = "https://api.spotify.com/v1/search?q=";
	let params = {
		headers: {
			'Authorization': 'Bearer '+token
		}
	}
	return new Promise((resolve, reject)=>{
		f(url+query.replace(' ', '+')+'&type=track&limit=1', params).then(res=>{
			return res.json()
		}).then(json=>{
			console.log(json)
			if(json.tracks && json.tracks.items[0])
				resolve(json.tracks.items[0].id);
			else
				reject(new Error('Song not found'));
		}).catch(e=>{
			console.error(e);
			reject(e);
		})
	})
}

//returns a massibe blob of stuff
function getTrackAnalysis(id, token){
	let url = "https://api.spotify.com/v1/audio-analysis/"+id;
	let params = {
		headers: {
			'Authorization': 'Bearer '+token
		}
	}
	return new Promise((resolve, reject)=>{
		f(url, params).then(result=>{
			return result.json()
		}).then(json=>{
			resolve(json)
		}).catch(e=>{
			reject(e)
		})
	})

}

//returns the song analysis
function searchSpotify(query){
	return new Promise((resolve, reject)=>{
		authorize().then(token=>{
			console.log('token: '+token)
			_search(query, token).then(songID=>{
				console.log('Song ID: '+songID)
				getTrackAnalysis(songID, token).then(analysis=>{
					resolve(analysis)
				}).catch(reject)
			}).catch(reject)
		}).catch(reject)
	})
}

function authorize(){
	let url = "https://accounts.spotify.com/api/token";
	let auth = new Buffer(process.env.SPOTIFY_ID + ':' + process.env.SPOTIFY_SECRET).toString('base64');
	let headers = {
		'Authorization':'Basic '+ auth,
		'Content-Type': 'application/x-www-form-urlencoded',
		'Accept': 'application/json'
	}
	let params ={
		'method': 'POST',
		'headers': headers,
		'body': 'grant_type=client_credentials'
	}
	return new Promise((resolve, reject)=>{
		f(url, params).then(response=>{
			return response.json()
			// console.log(response.body);
			// resolve(response);
		}).then(json=>{
			resolve(json.access_token)
		}).catch(reject);
	}) 
}

module.exports = searchSpotify;
