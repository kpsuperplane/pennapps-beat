import { Component } from '@angular/core';
import { NavController, NavParams } from 'ionic-angular';
import { FirebaseProvider } from '../../providers/firebase/firebase';

@Component({
  selector: 'page-game',
  templateUrl: 'game.html'
})
export class GamePage {

  user: string = null;
  sessionId: string = null;
  sessionName: string = null;
  session: {
    name: string;
    users: {[key: string]: true}[];
  } | null = null;

  qrHidden = true;
  qrVisible = false;

  constructor(public navCtrl: NavController, public navParams: NavParams, public firebaseProvider: FirebaseProvider) {
    this.user = this.navParams.get('user');
    this.sessionId = this.navParams.get('sessionId');
    this.firebaseProvider.getSession(this.sessionId).on('value', (snapshot) => {
      this.session = snapshot.val();
    });
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
