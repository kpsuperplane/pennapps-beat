require('dotenv').config()
const fetch = require('node-fetch')


function serialize(params){
	var urlencoded = ''
	for (var i in params) {
      urlencoded += '&' + i + '=' + params[i] // in the format &[key]=[value]
  }
  return '?' + urlencoded.substring(1);
}

function findYoutubeID(query, song){
	return new Promise((resolve, reject)=>{
		let url = 'https://www.googleapis.com/youtube/v3/search'
		let params = {
			part: 'snippet',
			q: encodeURIComponent(query) + '+radio+edit',
			key: process.env.YOUTUBE_API,
			type: 'video',
			maxResults: 1
		}
		fetch(url+serialize(params)).then(res=>{
			return res.json()
		}).then(result=>{
			console.log('VIDEO ID:'+result.items[0].id.videoId)
			resolve(song.addId(result.items[0].id.videoId))
		}).catch(e=>{
			reject(e)
		})
	})
}

module.exports = findYoutubeID