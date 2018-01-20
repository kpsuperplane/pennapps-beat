import { Component } from '@angular/core';
import { NavController, NavParams } from 'ionic-angular';
import { FirebaseProvider } from '../../providers/firebase/firebase';

@Component({
  selector: 'page-game',
  templateUrl: 'game.html'
})
export class GamePage {

  user: string = null;
  session: string = prompt ("Please enter a session name");
  
  


  qrHidden = true;
  qrVisible = false;

  constructor(public navCtrl: NavController, public navParams: NavParams, public firebaseProvider: FirebaseProvider) {
    this.user = this.navParams.get('user');
    this.session = this.navParams.get('session');
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

}
