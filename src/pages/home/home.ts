import { Component, ViewChild, ElementRef } from '@angular/core';
import { NavController } from 'ionic-angular';
import { GamePage } from '../game/game';
import { FirebaseProvider } from '../../providers/firebase/firebase';
import { BarcodeScanner } from '@ionic-native/barcode-scanner';

import SiriWave from './siriwave';
import { AlertController } from 'ionic-angular/components/alert/alert-controller';


@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage {

  /*@ViewChild('visualizer')
  visualizer:ElementRef;*/

  @ViewChild('siriWave') siriWave: ElementRef;
  
  scannedCode: string;

  
  opened = false;

  sessionName: string = null;

  constructor(
    public navCtrl: NavController, 
    public firebaseProvider: FirebaseProvider, 
    public barcodeScanner: BarcodeScanner,
    public alertCtrl: AlertController) {
  }

  state(){
    if (this.opened){
      this.opened=false;
    } else {
      this.opened=true;
    }
  }

  createSession() {
    /* this.alertCtrl.create({
      title: 'Please enter a session name',
      inputs: [
        {
          name: 'name',
          placeholder: 'Session Name'
        },
      ],
      buttons: [
        {
          text: 'Cancel'
        },
        {
          text: 'Next',
          handler: data => {
            this.firebaseProvider.createSession(data.name).then((data) => {
              this.navCtrl.push(GamePage, data);
            });
          }
        }
      ]
    }).present(); 
    */

    console.log(this.sessionName);
    

  }
  
  scanCode() {
    this.barcodeScanner.scan({formats: 'QR_CODE'}).then(session => {
      this.navCtrl.push(GamePage, this.firebaseProvider.joinSession(session.text));
    }, (err) => {
        console.log('Error: ', err);
    });
  }

  ngAfterViewInit() {
    new SiriWave({
      container: this.siriWave.nativeElement,
      width: window.innerWidth,
      height: 100,
      color: '#fff',
      speed: 0.015,
      frequency: 2.5
    }).start();
  }
  /*
    let sound;
    
    const audio = new Audio();
    const audioCtx = new((window as any).AudioContext || (window as any).webkitAudioContext)();

    audio.addEventListener('canplay', () => {
        sound = audioCtx.createMediaElementSource(audio);
        sound.connect(audioCtx.destination);
        const processor = audioCtx.createScriptProcessor(1024);
        const analyser = audioCtx.createAnalyser();
        sound.connect(analyser);
        processor.connect(audioCtx.destination);

        analyser.connect(processor);
        analyser.fftSize = 2048;

        const bufferLength = analyser.frequencyBinCount;

        let dataArray = new Uint8Array(bufferLength);

        processor.onaudioprocess = () => {
            analyser.getByteTimeDomainData(dataArray);
        }

        // Get a canvas defined with ID "oscilloscope"
        var canvas = this.visualizer.nativeElement as any;
        var canvasCtx = canvas.getContext("2d");

        // draw an oscilloscope of the current audio source

        const draw = () => {
            canvasCtx.clearRect(0,0,canvas.width,canvas.height)
            canvasCtx.lineWidth = 2;
            canvasCtx.strokeStyle = 'rgba(255, 255, 255, 0.8)';

            canvasCtx.beginPath();

            var sliceWidth = canvas.width * 1.0 / 32;
            var x = 0;

            for (var i = 0; i < 33; i++) {

              var v = dataArray[i] / 128.0;
              var y = v * canvas.height / 2;

              if (i === 0) {
                canvasCtx.moveTo(x, y);
              } else {
                canvasCtx.lineTo(x, y);
              }

              x += sliceWidth;
            }

            canvasCtx.lineTo(canvas.width + 1, canvas.height / 2);
            canvasCtx.stroke();
        };

        setInterval(() => {
          requestAnimationFrame(draw);
        }, 33.333);
        audio.play();

    });
    audio.src = 'assets/audio/hikarunara.mp3';
}*/

}
