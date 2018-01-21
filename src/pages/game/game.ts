import { Component, ViewChild, ElementRef } from '@angular/core';
import { NavController, NavParams } from 'ionic-angular';
import { FirebaseProvider } from '../../providers/firebase/firebase';
import axios from '../../axios';
import { ModalController } from 'ionic-angular/components/modal/modal-controller';
import { SearchPage } from './search/search';
import { LoadingController } from 'ionic-angular/components/loading/loading-controller';
import { YoutubeProvider } from '../../providers/youtube/youtube';

@Component({
  selector: 'page-game',
  templateUrl: 'game.html'
})

export class GamePage {
  ctx: any;

  @ViewChild('track') track: ElementRef;
  @ViewChild('canvas') canvas: ElementRef;
  trackCanvas = null;
  trackLeft: number = null;
  trackTouchPosition = -1;
  trackTouchTime = -1;
  trackLyrics = [];
  trackTouchVelocity = 0;
  trackFont="15px Lato";
  trackTime: number = 0;
  cuedId: string = "";
  muted: boolean = true;
  queuedKey: string = "";
  
  oldBpm: number = 0;
  newBpm: number = 0;

  loadingTrack: boolean = false;

  commitSeekTimeout: number = null;

  user: string = null;
  sessionId: string = null;
  sessionName: string = null;
  result = null;
  playingInfo: {} | null = null;
  secondWidth = 30;
  songs: {title: string, artist: string}[] = [];
  session: {
    name: string;
    users: {[key: string]: any}[];
  } | null = null;
  playing: {
    id: string,
    seconds: number, 
    userId: string,
    timestamp: number,
    key: string,
    internal_id: number
  } | null = null;

  qrHidden = true;
  qrVisible = false;

  time: number = 0;


  constructor(public navCtrl: NavController, public navParams: NavParams, public firebaseProvider: FirebaseProvider, public modalCtrl: ModalController, public loadingCtrl: LoadingController, public youtubeProvider: YoutubeProvider) {
    this.navCtrl.swipeBackEnabled = false;
    this.user = this.navParams.get('user');
    this.sessionId = this.navParams.get('sessionId');
    this.playingInfo = null;
    this.firebaseProvider.getSession(this.sessionId).child('playing').on('value', (snapshot) => {
      this.playing = snapshot.val();
      if (this.playing !== null) {
        axios.get('/music/id/' + this.playing.internal_id).then(({data}) => {
          this.playingInfo = data;
          this.oldBpm = this.newBpm;
          this.newBpm = data.analysis.track.tempo;
        });
        this.youtubeProvider.play(this.playing.userId, this.playing.id, this.playing.key, this.playing.seconds, this.playing.timestamp);
      }
    });
    this.firebaseProvider.getSession(this.sessionId).child('users').on('value', (snapshot) => {
      const data = snapshot.val();
      const keys = Object.keys(data);
      for(const key of keys) {
        this.youtubeProvider.cue(key, data[key].id, data[key].key, data[key].start);
      }
      this.youtubeProvider.clean(keys.filter(key => data[key].id != -1).map(key => data[key].key));
    });
    this.firebaseProvider.getSession(this.sessionId).once('value', (snapshot) => {
      this.session = snapshot.val();
      if (Object.keys(this.session.users).length === 1) {
        this.mute();
      }
    });
    axios.get('/music').then(({data}) => {
      this.songs = data;
    });

  }

  mute() {
    this.muted = !this.muted;
    if (this.muted) this.youtubeProvider.mute();
    else this.youtubeProvider.unmute();
  }

  renderTrack = () => {
    const { width, height } = this.track.nativeElement.getBoundingClientRect();
    this.trackCanvas.clearRect(0, 0, width, height);
    this.trackCanvas.beginPath();
    this.trackCanvas.lineWidth = 1;
    this.trackCanvas.strokeStyle = '#CCCCCC';
    this.trackCanvas.fillStyle = '#CCCCCC';
    for (const bar of this.result.analysis.bars) {
      const left = bar.start * this.secondWidth - this.trackLeft;
      if (left < 0) continue;
      if (left > width) break;
      this.trackCanvas.moveTo(left, 35);
      this.trackCanvas.lineTo(left,height - 35);
      this.trackCanvas.stroke();
    }
    for (const beat of this.result.analysis.beats) {
      const left = beat.start * this.secondWidth - this.trackLeft;
      if (left < 0) continue;
      if (left > width) break;
      this.trackCanvas.beginPath();
      this.trackCanvas.arc(left, 20 + (height - 40) / 2, 3, 0, 2 * Math.PI);
      this.trackCanvas.fill();
    }
    this.trackCanvas.fillStyle = '#000';
    this.trackCanvas.font=this.trackFont;
    const now = ((this.trackLeft + width/2)/this.secondWidth) * 1000;
    this.trackTime = now;
    const lyricIndex = Math.max(0, this.trackLyrics.findIndex(lyric => lyric[0] > now) - 1);
    const lyric = this.trackLyrics[lyricIndex];
    const percentIn = (now - lyric[0]) / (this.trackLyrics[lyricIndex + 1][0] - lyric[0]);
    const leftCorner = (width / 2) - lyric[1] * percentIn;
    //const leftCorner = (lyric[0]/1000 * this.secondWidth) - this.trackLeft + width/2 - lyric[1] * percentIn;
    this.trackCanvas.beginPath();
    this.trackCanvas.fillText(lyric[2], leftCorner, 15);
    this.trackCanvas.beginPath();
    this.trackCanvas.fillStyle = '#888';
    let left = leftCorner;
    for (let index = lyricIndex - 1; index >= 0; index--) {
      const prevLyric = this.trackLyrics[index];
      this.trackCanvas.fillText(prevLyric[2], left - prevLyric[1], 15);
      left -= prevLyric[1];
      if (left < 0) break;
    }
    left = leftCorner + lyric[1];
    for (let index = lyricIndex + 1; index < this.trackLyrics.length; index++) {
      const nextLyric = this.trackLyrics[index];
      this.trackCanvas.fillText(nextLyric[2], left, 15);
      left += nextLyric[1];
      if (left >= width) break;
    }
    this.trackCanvas.beginPath();
    this.trackCanvas.strokeStyle = "#D056DB";
    this.trackCanvas.fillStyle = "#D056DB";
    this.trackCanvas.moveTo(width/2, 25);
    this.trackCanvas.lineTo(width/2,height - 25);
    this.trackCanvas.stroke();
    const minutes = Math.floor((now / 1000)/60);
    const seconds = Math.floor(now / 1000) - minutes * 60;
    const millesconds = Math.round(now - seconds * 1000 - minutes * 1000 * 60);
    const pad = (number) => {
      return number < 10 ? '0' + number : number;
    }
    const padMil = (number) => {
      let str = number.toString();
      while(str.length < 4) str += '0';
      return str;
    }
    this.trackCanvas.fillText(pad(minutes) + ':' + pad(seconds) + '.' +padMil(millesconds), width/2 - 40, 100);
    const grd=this.trackCanvas.createLinearGradient(width * 0.8,0,width,0);
    grd.addColorStop(0,"#FFFFFF00");
    grd.addColorStop(1,"#FFFFFFFF");
    const grd2=this.trackCanvas.createLinearGradient(0,0,width * 0.1,0);
    grd2.addColorStop(0,"#FFFFFFFF");
    grd2.addColorStop(1,"#FFFFFF00");
    this.trackCanvas.beginPath();
    this.trackCanvas.fillStyle=grd2;
    this.trackCanvas.fillRect(0, 0, width * 0.2, height);
    this.trackCanvas.beginPath();
    this.trackCanvas.fillStyle=grd;
    this.trackCanvas.fillRect(width * 0.8, 0, width * 0.2, height);

  }
  commitSeek = () => {
    clearTimeout(this.commitSeekTimeout);
    this.firebaseProvider.getSession(this.sessionId).child('users').child(this.user).update({id: this.cuedId, key: this.queuedKey, start: this.trackTime});
  }
  search() {
    const modal = this.modalCtrl.create(SearchPage, {songs: this.songs});
    modal.onDidDismiss(query => {
      if (query !== null){
        this.loadingTrack = true;
        axios.get('/music/id/' + query).then(({data}) => {
          this.loadingTrack = false;
          this.result = data;
          this.youtubeProvider.search(this.result.title + ' ' + this.result.artist).then(({data}) => {
            this.cuedId = data.items[0].id.videoId;
            this.queuedKey = this.cuedId + this.user + new Date().getTime();
            this.firebaseProvider.getSession(this.sessionId).child('users').child(this.user).set({id: this.cuedId, key: this.queuedKey, start: 0});
          });
          const words = [];
          const pseudoCanvas = document.createElement("canvas");
          const context = pseudoCanvas.getContext("2d");
          context.font = this.trackFont;
          for (let {timestamp, lyric} of this.result.lyrics) {
            if (lyric[0] !== '<') words.push([timestamp, context.measureText(lyric).width + 5, lyric]);
            let left = 0;
            while (lyric[0] === '<') {
              const endIndex = lyric.indexOf('>');
              const time = left + timestamp;
              left += parseInt(lyric.substring(1, endIndex));
              lyric = lyric.substring(endIndex + 1);
              let end = lyric.indexOf('<');
              if (end === -1) end = lyric.length;
              const text = lyric.substring(0, end);
              words.push([time, context.measureText(text).width + 5, text]);
              lyric = lyric.substring(end);
            };
          }
          this.trackTime = 0;
          this.trackLyrics = words;
          this.trackLeft = -(this.track.nativeElement.getBoundingClientRect().width/2);
          this.renderTrack();/*
          const curTime = new Date().getTime();
          setInterval(() => {
            this.trackLeft = ((new Date().getTime() - curTime)/1000) * this.secondWidth - (this.track.nativeElement.getBoundingClientRect().width/2);
            this.renderTrack();
          }, 16.66);*/
        });
      }
    });
    modal.present();
  }

  trackTouchStart = (e) => {
    this.trackTouchPosition = e.touches[0].screenX;
  }

  trackTouchMove = (e) => {
    const now = new Date().getTime();
    this.trackTouchVelocity = (e.touches[0].screenX - this.trackTouchPosition)/Math.max(1, (now - this.trackTouchTime)/1000);
    this.trackLeft -= e.touches[0].screenX - this.trackTouchPosition;
    this.trackTouchPosition = e.touches[0].screenX; 
    this.trackTouchTime = now;
    requestAnimationFrame(this.renderTrack);
  }

 
  submit() {
    const newKey = this.cuedId + '-' + this.user + new Date().getTime();
    this.firebaseProvider.getSession(this.sessionId).child('playing').set({id: this.cuedId, key: this.queuedKey, seconds: this.trackTime, timestamp: new Date().getTime(), internal_id: this.result._id, userId: this.user}).then(() => {
      this.playing.userId = this.user;
      this.queuedKey = newKey;
      this.firebaseProvider.getSession(this.sessionId).child('users').child(this.user).update({key: newKey});
    });
    
  }

 

  trackTouchEnd = (e) => {
    let velocity = this.trackTouchVelocity;
    const interval = setInterval(() => {
      this.trackLeft -= velocity;
      requestAnimationFrame(this.renderTrack);
      velocity /= 1.25;
      if (Math.abs(velocity) < 1) {
        clearInterval(interval);
        if (this.commitSeekTimeout) clearTimeout(this.commitSeekTimeout);
        this.commitSeekTimeout = setTimeout(this.commitSeek, 1500);
      }
    }, 16.66);
  }

  ngAfterViewInit() {
    this.trackCanvas = this.track.nativeElement.getContext('2d');
    if (window.devicePixelRatio > 1) {
      const { width, height } = this.track.nativeElement.getBoundingClientRect();
      this.track.nativeElement.setAttribute('width', width * 2);
      this.track.nativeElement.setAttribute('height', height * 2);
      this.trackCanvas.width = width * window.devicePixelRatio;
      this.trackCanvas.height = height * window.devicePixelRatio;
      this.track.nativeElement.style.width = width + 'px';
      this.track.nativeElement.style.height = height + 'px';
      this.trackCanvas.scale(window.devicePixelRatio, window.devicePixelRatio);
    }
    this.track.nativeElement.addEventListener('touchstart', this.trackTouchStart);
    this.track.nativeElement.addEventListener('touchmove', this.trackTouchMove);
    this.track.nativeElement.addEventListener('touchend', this.trackTouchEnd);
  }

  showQr() {
    this.qrHidden = false;
    setTimeout(() => {
      this.qrVisible = true;
    }, 100);
  }
  hideQr() {
      this.qrVisible = false;
      setTimeout(() => {
        this.qrHidden = true;
      }, 200);
  }

  renderFrame = () => {
    const x = 0;
    const { width, height } = this.canvas.nativeElement.getBoundingClientRect();
    this.ctx.fillStyle = "#000";
    this.ctx.clearRect(0, 0, width, height);
    //console.log(this.playingInfo);
    /*for (var i = 0; i < 1000; i++) {
      const barHeight = dataArray[i];
      this.ctx.fillRect(x, HEIGHT - barHeight, barWidth, barHeight+100);
      x += barWidth + 10;
    }*/
  }

  
  ionViewDidLoad() {
    var canvas = this.canvas.nativeElement;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    this.ctx = canvas.getContext("2d");
    setInterval(() => {
      requestAnimationFrame(this.renderFrame)
    }, 16.66);
  }
}
