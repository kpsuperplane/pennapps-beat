import { Component } from '@angular/core';
import { NavController, NavParams } from 'ionic-angular';
import { FirebaseProvider } from '../../providers/firebase/firebase';
import axios from '../../axios';
import { ModalController } from 'ionic-angular/components/modal/modal-controller';
import { SearchPage } from './search/search';
import { LoadingController } from 'ionic-angular/components/loading/loading-controller';

@Component({
  selector: 'page-game',
  templateUrl: 'game.html'
})
export class GamePage {

  user: string = null;
  sessionId: string = null;
  sessionName: string = null;
  result = null;
  songs: {title: string, artist: string}[] = [];
  session: {
    name: string;
    users: {[key: string]: true}[];
  } | null = null;

  qrHidden = true;
  qrVisible = false;

  time: number = 0;
  

  constructor(public navCtrl: NavController, public navParams: NavParams, public firebaseProvider: FirebaseProvider, public modalCtrl: ModalController, public loadingCtrl: LoadingController) {
    this.user = this.navParams.get('user');
    this.sessionId = this.navParams.get('sessionId');
    this.firebaseProvider.getSession(this.sessionId).on('value', (snapshot) => {
      this.session = snapshot.val();
    });
    axios.get('/music').then(({data}) => {
      this.songs = data;
    });
  }

  search() {
    const modal = this.modalCtrl.create(SearchPage, {songs: this.songs});
    modal.onDidDismiss(query => {
      if (query !== null){
        const loading = this.loadingCtrl.create({
          content: 'Loading...'
        });
        loading.present();
        axios.get('/music/' + query).then(({data}) => {
          this.result = data;
          loading.dismiss();
        });
      }
    });
    modal.present();
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
