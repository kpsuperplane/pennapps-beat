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
  lyricLyrics: any[];
  lyricCtx: any;
  canvasRect: any;
  ctx: any;

  @ViewChild('track') track: ElementRef;
  @ViewChild('lyrics') lyrics: ElementRef;
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
  scoreboard: any[] = [];
  queuedKey: string = "";
  gameInterval: number = null;
  
  oldBpm: number = 0;
  newBpm: number = 0;
  difference: number = 0;

  loadingTrack: boolean = false;

  commitSeekTimeout: number = null;

  user: string = null;
  sessionId: string = null;
  sessionName: string = null;
  result = null;
  playingInfo: any | null = null;
  secondWidth = 30;
  songs: {title: string, artist: string}[] = [];
  users: any[] = null;
  session: {
    name: string;
    users: {[key: string]: any}[];
  } | null = null;
  playing: {
    id: string,
    seconds: number, 
    userId: string,
    userPoints: number,
    timestamp: number,
    key: string,
    internal_id: number
  } | null = null;

  qrHidden = true;
  qrVisible = false;

  time: number = 0;

  globalInterval = 0;


  addScore(amount: number) {
    this.users[this.user].userPoints += amount;
    return this.firebaseProvider.getSession(this.sessionId).child('users').child(this.user).update({userPoints: this.users[this.user].userPoints});
  }
  constructor(public navCtrl: NavController, public navParams: NavParams, public firebaseProvider: FirebaseProvider, public modalCtrl: ModalController, public loadingCtrl: LoadingController, public youtubeProvider: YoutubeProvider) {
    this.navCtrl.swipeBackEnabled = false;
    this.user = this.navParams.get('user');
    this.sessionId = this.navParams.get('sessionId');
    this.playingInfo = null;
    this.globalInterval = setInterval(()=>{
      if (this.playing && this.playing.userId == this.user) this.addScore(5);
    }, 1000);
    this.firebaseProvider.getSession(this.sessionId).child('playing').on('value', (snapshot) => {
      this.playing = snapshot.val();
      if (this.playing !== null) {
        axios.get('/music/id/' + this.playing.internal_id).then(({data}) => {
          this.playingInfo = data;
          const words = [];
          const pseudoCanvas = document.createElement("canvas");
          const context = pseudoCanvas.getContext("2d");
          context.font = this.trackFont;
          for (let {timestamp, lyric} of data.lyrics) {
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
          this.lyricLyrics = words;
          /*
          const curTime = new Date().getTime();
          setInterval(() => {
            this.trackLeft = ((new Date().getTime() - curTime)/1000) * this.secondWidth - (this.track.nativeElement.getBoundingClientRect().width/2);
            this.renderTrack();
          }, 16.66);*/
          this.visualize();
          this.oldBpm = this.newBpm;
          this.newBpm = data.analysis.track.tempo;
          this.updateScore();
        });
        this.youtubeProvider.play(this.playing.userId, this.playing.id, this.playing.key, this.playing.seconds, this.playing.timestamp);
      }
    });
    this.firebaseProvider.getSession(this.sessionId).child('users').on('value', (snapshot) => {
      const data = snapshot.val();
      const keys = Object.keys(data);
      this.users = data;
      for(const key of keys) {
        this.youtubeProvider.cue(key, data[key].id, data[key].key, data[key].start);
      }
      const scores = keys.filter(key => key != this.user).map(key => ({score: data[key].userPoints, name: data[key].name})).sort((a, b) => b.score - a.score);
      this.scoreboard = scores.slice(0, Math.min(scores.length, 2));

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

  updateScore(){
    this.difference = this.newBpm - this.oldBpm;
     if (this.difference >0){
      if (40>this.difference){
        this.addScore(Math.round((40-this.difference)*10));
      }
    } else {
      this.difference = -this.difference;
      if (40>this.difference){
        this.addScore(Math.round((40-this.difference)*10));
      }
    } 
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
          this.cuedId = data.youtubeID;
          this.queuedKey = this.cuedId + this.user + new Date().getTime();
          this.firebaseProvider.getSession(this.sessionId).child('users').child(this.user).update({id: this.cuedId, key: this.queuedKey, start: 0});
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
    this.lyricCtx = this.lyrics.nativeElement.getContext('2d');
    const deviceRatio = window.devicePixelRatio;
    if (deviceRatio > 1) {
      {
        const { width, height } = this.track.nativeElement.getBoundingClientRect();
        this.track.nativeElement.setAttribute('width', width * deviceRatio);
        this.track.nativeElement.setAttribute('height', height * deviceRatio);
        this.trackCanvas.width = width * deviceRatio;
        this.trackCanvas.height = height * deviceRatio;
        this.track.nativeElement.style.width = width + 'px';
        this.track.nativeElement.style.height = height + 'px';
        this.trackCanvas.scale(deviceRatio, deviceRatio);
      }
      {
        let { width, height } = this.lyrics.nativeElement.getBoundingClientRect();
        this.lyrics.nativeElement.setAttribute('width', width * deviceRatio);
        this.lyrics.nativeElement.setAttribute('height', height * deviceRatio);
        this.lyricCtx.width = width * deviceRatio;
        this.lyricCtx.height = height * deviceRatio;
        this.lyrics.nativeElement.style.width = width + 'px';
        this.lyrics.nativeElement.style.height = height + 'px';
        this.lyricCtx.scale(deviceRatio, deviceRatio);
      }
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

  visualize = () => {
    if (this.gameInterval !== null) clearInterval(this.gameInterval);
    this.ctx.strokeStyle = "#FFFFFFAA";
    const widthTime = 250;
    let segmentIndex = 0;

    function drawLines(ctx, pts) {
      ctx.moveTo(pts[0], pts[1]);
      for(let i = 2; i < pts.length - 1; i += 2) ctx.lineTo(pts[i], pts[i+1]);
    }

    function drawCurve(ctx, ptsa, tension = 0.5, isClosed = false, numOfSegments = 16, showPoints = false) {

      ctx.beginPath();

      drawLines(ctx, getCurvePoints(ptsa, tension, isClosed, numOfSegments));
      
      if (showPoints) {
        ctx.beginPath();
        for(var i=0;i<ptsa.length-1;i+=2) 
          ctx.rect(ptsa[i] - 2, ptsa[i+1] - 2, 4, 4);
      }

      ctx.stroke();
    }


    function getCurvePoints(pts, tension, isClosed, numOfSegments) {

      // use input value if provided, or use a default value	 
      tension = (typeof tension != 'undefined') ? tension : 0.5;
      isClosed = isClosed ? isClosed : false;
      numOfSegments = numOfSegments ? numOfSegments : 16;

      var _pts = [], res = [],	// clone array
          x, y,			// our x,y coords
          t1x, t2x, t1y, t2y,	// tension vectors
          c1, c2, c3, c4,		// cardinal points
          st, t, i;		// steps based on num. of segments

      // clone array so we don't change the original
      //
      _pts = pts.slice(0);

      // The algorithm require a previous and next point to the actual point array.
      // Check if we will draw closed or open curve.
      // If closed, copy end points to beginning and first points to end
      // If open, duplicate first points to befinning, end points to end
      if (isClosed) {
        _pts.unshift(pts[pts.length - 1]);
        _pts.unshift(pts[pts.length - 2]);
        _pts.unshift(pts[pts.length - 1]);
        _pts.unshift(pts[pts.length - 2]);
        _pts.push(pts[0]);
        _pts.push(pts[1]);
      }
      else {
        _pts.unshift(pts[1]);	//copy 1. point and insert at beginning
        _pts.unshift(pts[0]);
        _pts.push(pts[pts.length - 2]);	//copy last point and append
        _pts.push(pts[pts.length - 1]);
      }

      // ok, lets start..

      // 1. loop goes through point array
      // 2. loop goes through each segment between the 2 pts + 1e point before and after
      for (i=2; i < (_pts.length - 4); i+=2) {
        for (t=0; t <= numOfSegments; t++) {

          // calc tension vectors
          t1x = (_pts[i+2] - _pts[i-2]) * tension;
          t2x = (_pts[i+4] - _pts[i]) * tension;

          t1y = (_pts[i+3] - _pts[i-1]) * tension;
          t2y = (_pts[i+5] - _pts[i+1]) * tension;

          // calc step
          st = t / numOfSegments;

          // calc cardinals
          c1 =   2 * Math.pow(st, 3) 	- 3 * Math.pow(st, 2) + 1; 
          c2 = -(2 * Math.pow(st, 3)) + 3 * Math.pow(st, 2); 
          c3 = 	   Math.pow(st, 3)	- 2 * Math.pow(st, 2) + st; 
          c4 = 	   Math.pow(st, 3)	- 	  Math.pow(st, 2);

          // calc x and y cords with common control vectors
          x = c1 * _pts[i]	+ c2 * _pts[i+2] + c3 * t1x + c4 * t2x;
          y = c1 * _pts[i+1]	+ c2 * _pts[i+3] + c3 * t1y + c4 * t2y;

          //store points in array
          res.push(x);
          res.push(y);

        }
      }

      return res;
    }
    const { width, height } = this.lyrics.nativeElement.getBoundingClientRect();
    const renderFrame = () => {
      this.ctx.clearRect(0, 0, this.canvasRect.width, this.canvasRect.height);
      const time = this.playing.seconds * 1000 + (new Date().getTime() - this.playing.timestamp);
      while (segmentIndex < this.playingInfo.analysis.segments.length && this.playingInfo.analysis.segments[segmentIndex].start < time/1000) ++segmentIndex;
      this.ctx.stroke();
      this.ctx.beginPath();
      const points = [];
      const addPoint = (i) => {
        if (i < 0 || i >= this.playingInfo.analysis.segments.length) return;
        const segmentPercentLocation = (1-(time - this.playingInfo.analysis.segments[i].start * 1000)/widthTime);
        const volume = Math.max(0, Math.min(1, ((this.playingInfo.analysis.segments[i].loudness_start + this.playingInfo.analysis.segments[i].loudness_max)/2 + this.playingInfo.analysis.segments[i].loudness_max_time + 40)/40));
        const x = this.canvasRect.width * segmentPercentLocation;
        const y = this.canvasRect.height - (this.canvasRect.height * volume);
        points.push(x);
        points.push(y);
      }
      let i;
      for (i = segmentIndex; i >= 0 && i < this.playingInfo.analysis.segments.length && (time - this.playingInfo.analysis.segments[i].start * 1000) < widthTime; --i) addPoint(i);
      for (let j = 0; j < 5; j++) addPoint(i - j);
      drawCurve(this.ctx, points);
      const lyricLeft = (time/1000) * this.secondWidth - (width/2);
      this.lyricCtx.clearRect(0, 0, width, height);
      this.lyricCtx.beginPath();
      this.lyricCtx.lineWidth = 1;
      this.lyricCtx.strokeStyle = '#FFFFFF66';
      this.lyricCtx.fillStyle = '#FFFFFF66';
      for (const bar of this.playingInfo.analysis.bars) {
        const left = bar.start * this.secondWidth - lyricLeft;
        if (left < 0) continue;
        if (left > width) break;
        this.lyricCtx.moveTo(left, 45);
        this.lyricCtx.lineTo(left, height - 35);
        this.lyricCtx.stroke();
      }
      for (const beat of this.playingInfo.analysis.beats) {
        const left = beat.start * this.secondWidth - lyricLeft;
        if (left < 0) continue;
        if (left > width) break;
        this.lyricCtx.beginPath();
        this.lyricCtx.arc(left, 45 + (((height - 35) - 45)/2), 3, 0, 2 * Math.PI);
        this.lyricCtx.fill();
      }
      this.lyricCtx.fillStyle = '#FFFFFFFF';
      this.lyricCtx.font=this.trackFont;
      const now = ((lyricLeft + width/2)/this.secondWidth) * 1000;
      const lyricIndex = Math.max(0, this.lyricLyrics.findIndex(lyric => lyric[0] > now) - 1);
      const lyric = this.lyricLyrics[lyricIndex];
      const percentIn = (now - lyric[0]) / (this.lyricLyrics[lyricIndex + 1][0] - lyric[0]);
      const leftCorner = (width / 2) - lyric[1] * percentIn;
      //const leftCorner = (lyric[0]/1000 * this.secondWidth) - this.trackLeft + width/2 - lyric[1] * percentIn;
      this.lyricCtx.beginPath();
      this.lyricCtx.fillText(lyric[2], leftCorner, 20);
      this.lyricCtx.beginPath();
      this.lyricCtx.fillStyle = '#FFFFFFAA';
      let left = leftCorner;
      for (let index = lyricIndex - 1; index >= 0; index--) {
        const prevLyric = this.lyricLyrics[index];
        this.lyricCtx.fillText(prevLyric[2], left - prevLyric[1], 20);
        left -= prevLyric[1];
        if (left < 0) break;
      }
      left = leftCorner + lyric[1];
      for (let index = lyricIndex + 1; index < this.lyricLyrics.length; index++) {
        const nextLyric = this.lyricLyrics[index];
        this.lyricCtx.fillText(nextLyric[2], left, 20);
        left += nextLyric[1];
        if (left >= width) break;
      }

    }
    this.gameInterval = setInterval(renderFrame, 16.66);
  }

  ionViewWillLeave() {
    if (this.globalInterval !== null) clearInterval(this.globalInterval);
    this.youtubeProvider.clean(-1);
  }

  ionViewDidLoad() {
    var canvas = this.canvas.nativeElement;
    this.canvasRect = this.canvas.nativeElement.getBoundingClientRect();
    const { width, height } = this.canvasRect;
    canvas.width = width;
    canvas.height = height;
    const deviceRatio = window.devicePixelRatio;
    this.ctx = canvas.getContext("2d");
    this.canvas.nativeElement.setAttribute('width', width * 2);
    this.canvas.nativeElement.setAttribute('height', height * 2);
    this.ctx.width = width * deviceRatio;
    this.ctx.height = height * deviceRatio;
    this.canvas.nativeElement.style.width = width + 'px';
    this.canvas.nativeElement.style.height = height + 'px';
    this.ctx.scale(deviceRatio, deviceRatio);
  }
}
