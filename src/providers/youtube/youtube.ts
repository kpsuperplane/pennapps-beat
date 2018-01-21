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
  muted: boolean = true;
  constructor(public http: HttpClient) {
    setInterval(this.syncDaemon, 2000);
  }

  syncDaemon = () => {
    if (this.currentlyPlaying !== null && this.currentlyPlaying.getPlayerState() !== 2 && this.currentlyPlaying.getPlayerState() !== 1) this.currentlyPlaying.playVideo();
    if (this.currentlyPlaying !== null && typeof this.currentlyPlaying.getCurrentTime === 'function') {
      const currentTime = this.currentlyPlaying.getCurrentTime();
      const diff = ((new Date().getTime() - this.start) - currentTime * 1000);
      console.log(diff);
      if (diff > 100) this.currentlyPlaying.seekTo(currentTime + diff/500 + 0.1, true);
      else if (diff < -100) this.currentlyPlaying.seekTo(currentTime + (diff/500), true);
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
      container.className = 'yt-player';
      document.body.appendChild(container);
      this.players[key] = new (window as any).YT.Player('yt-player-'+key, {
        height: 80,
        width: 160,
        videoId: id,
        playerVars: { 
          playsinline: 1,
          start: start/1000 + 0.735,
          autoplay: 0
        },
        events: {
          'onReady': () => {
            try {
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
            this.players[key].seekTo(start/1000 + 0.735, true);
            this.players[key].pauseVideo();

          }
        }, 50);
      } else {
        this.players[key].seekTo(start/1000 + 0.35, true);
        this.players[key].pauseVideo();
      }
    }
  }

  mute() {
    this.muted = true;
    if (this.currentlyPlaying) this.currentlyPlaying.mute();
  }

  unmute() {
    this.muted = false;
    if (this.currentlyPlaying) this.currentlyPlaying.unMute();
  }

  clean(saveKeys) {
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
    if (this.muted) this.currentlyPlaying.mute();
    if (typeof this.currentlyPlaying.playVideo !== 'function') {
      const interval = setInterval(() => {
        if (this.currentlyPlaying === undefined) return;
        if (typeof this.currentlyPlaying.playVideo === 'function') {
          clearInterval(interval);
          this.currentlyPlaying.seekTo(start/1000 + 0.35, true);
          this.currentlyPlaying.playVideo();
        }
      }, 50);
    } else {
      this.currentlyPlaying.seekTo(start/1000 + 0.35, true);
      this.currentlyPlaying.playVideo();
    }
    this.start = timestamp - start;

    delete this.players[key];
  }

}
