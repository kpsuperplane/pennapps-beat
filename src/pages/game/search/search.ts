import { Component, ViewChild } from '@angular/core';
import { NavController, NavParams } from 'ionic-angular';
import Fuse from 'fuse.js';
import { ViewController } from 'ionic-angular/navigation/view-controller';
import { StatusBar } from '@ionic-native/status-bar';
import { Searchbar } from 'ionic-angular/components/searchbar/searchbar';

@Component({
  selector: 'page-search',
  templateUrl: 'search.html',
})
export class SearchPage {
    @ViewChild('input') searchInput: Searchbar;
    fuse = null;
    query = "";
    results = [];
    constructor(public navCtrl: NavController, public params: NavParams, public viewCtrl: ViewController, public statusBar: StatusBar) {
        this.statusBar.styleDefault();
        this.results = this.params.get('songs');
        this.fuse = new Fuse(this.params.get('songs'), {keys: ['title', 'artist']})
    }
    ionViewDidEnter() { 
        setTimeout(() => {
            this.searchInput.setFocus();
        }, 150);
    }
    ionViewWillLeave() {
        this.statusBar.styleBlackTranslucent();
    }
    searchItems($event) {
        this.query = $event.target.value;
        this.results = this.fuse.search(this.query);
    }
    hide(query) {
        this.viewCtrl.dismiss(query);
    }
}



