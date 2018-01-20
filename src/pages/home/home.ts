import { Component } from '@angular/core';
import { NavController } from 'ionic-angular';
import { FirebaseProvider } from '../../providers/firebase/firebase';
import { GamePage } from '../game/game';

@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage {

  constructor(public navCtrl: NavController, public firebaseProvider: FirebaseProvider) {

  }

  createSession() {
    this.navCtrl.push(GamePage, this.firebaseProvider.createSession());
  }

}
