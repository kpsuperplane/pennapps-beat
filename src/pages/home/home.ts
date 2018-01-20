import { Component } from '@angular/core';
import { NavController } from 'ionic-angular';
import { GamePage } from '../game/game';
import { FirebaseProvider } from '../../providers/firebase/firebase';
import { BarcodeScanner } from '@ionic-native/barcode-scanner';


@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage {

  scannedCode: string;

  constructor(public navCtrl: NavController, public firebaseProvider: FirebaseProvider, public barcodeScanner: BarcodeScanner) {


  }

  createSession() {
    this.navCtrl.push(GamePage, this.firebaseProvider.createSession());
  }
  
  scanCode() {
    this.barcodeScanner.scan({formats: 'QR_CODE'}).then(session => {
      this.navCtrl.push(GamePage, this.firebaseProvider.joinSession(session.text));
    }, (err) => {
        console.log('Error: ', err);
    });
  }

}
