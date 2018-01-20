const Lyric = require('./Lyric');
class Song{
	constructor(metadata){
		this.artist = metadata.artist;
		this.title = metadata.title;
		this.rawLyrics = metadata.rawLyrics;
		this.lyrics = [];
	}
	addLyric(lyric){
		if(lyric instanceof Lyric){
			this.lyrics.push(lyric)
		}else{
			throw new Error('Expected lyric of type Lyric, got: '+(typeof lyric));
		}
	}
}

module.exports = Song;