import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import axios from '../../axios';

const key = 'AIzaSyBN92IxK_KzS6sHRHVlcuFO50K_hhdGlc0';
var tag = document.createElement('script');
tag.src = "https://www.youtube.com/iframe_api";
var firstScriptTag = document.getElementsByTagName('script')[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

/*
  Generated class for the YoutubeProvider provider.

  See https://angular.io/guide/dependency-injection for more info on providers
  and Angular DI.
*/
@Injectable()
export class YoutubeProvider {
  players: {[key: string]: any} = {};
  currentlyPlaying: any = null;
  currentKey: string = "";
  start: number = 0;
  constructor(public http: HttpClient) {
    setInterval(this.syncDaemon, 2500);
  }

  syncDaemon = () => {
    if (this.currentlyPlaying !== null && typeof this.currentlyPlaying.getCurrentTime === 'function') {
      console.log((new Date().getTime() - this.currentlyPlaying.getCurrentTime() * 1000 - this.start), new Date().getTime() - this.currentlyPlaying.getCurrentTime() * 1000, this.currentlyPlaying.getCurrentTime() * 1000, this.start);
      const diff = (new Date().getTime() - this.currentlyPlaying.getCurrentTime() * 1000 - this.start);
      if (Math.abs(diff) > 50) this.currentlyPlaying.seekTo((new Date().getTime() - this.start + diff/2)/1000);
    }
  }

  search(query: string) {
    return axios.get('https://www.googleapis.com/youtube/v3/search?key=' + key + '&part=snippet&type=video&videoEmbeddable=true&q=' + encodeURIComponent(query + ' radio edit'));
  }

  cue(user: string, id: string, key: string, start: number) {
    if (start === -1) return;
    if (!this.players[key]) {
      const container = document.createElement('div');
      container.id = 'yt-player-' + key;
      document.body.appendChild(container);
      this.players[key] = new (window as any).YT.Player('yt-player-'+key, {
        height: 80,
        autoplay: 0,
        width: 160,
        playsinline: 1,
        videoId: id,
        events: {
          'onReady': () => {
            try {
              this.players[key].seekTo(start/1000);
              this.players[key].pauseVideo();
            } catch(e) {}
          }
        }
      });
    } else {
      if (this.players[key] === undefined) return;
      if (!this.players[key].seekTo) {
        const interval = setInterval(() => {
          if (this.players[key] === undefined) return;
          if (this.players[key].seekTo) {
            clearInterval(interval);
            this.players[key].seekTo(start/1000);
          }
        }, 50);
      } else {
        this.players[key].seekTo(start/1000);
      }
    }
  }

  clean(saveKeys) {
    console.log(saveKeys);
    const toDelete = Object.keys(this.players).filter(key => saveKeys.indexOf(key) === -1 && key !== this.currentKey);
    for (const key of toDelete) {
      try {
        this.players[key].destroy();
      } catch (e) {}
      delete this.players[key];
    }
  }
  

  play(user: string, id: string, key: string, start: number, timestamp: number) {
    this.currentKey = key;
    if (this.currentlyPlaying !== null) {
      this.currentlyPlaying.destroy();
    }
    this.currentlyPlaying = this.players[key];
    if (typeof this.currentlyPlaying.playVideo !== 'function') {
      const interval = setInterval(() => {
        if (this.currentlyPlaying === undefined) return;
        if (typeof this.currentlyPlaying.playVideo === 'function') {
          clearInterval(interval);
          this.currentlyPlaying.seekTo(start);
          this.currentlyPlaying.playVideo();
        }
      }, 50);
    } else {
      this.currentlyPlaying.playVideo();
    }
    this.start = timestamp - start;

    delete this.players[key];
  }

}
