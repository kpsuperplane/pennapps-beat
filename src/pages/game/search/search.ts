import { Component } from '@angular/core';
import { NavController, NavParams } from 'ionic-angular';
import Fuse from 'fuse.js';
import { ViewController } from 'ionic-angular/navigation/view-controller';

@Component({
  selector: 'page-search',
  templateUrl: 'search.html'
})
export class SearchPage {
    fuse = null;
    query = "";
    results = [];
    constructor(public navCtrl: NavController, public params: NavParams, public viewCtrl: ViewController) {
        this.fuse = new Fuse(this.params.get('songs'), {keys: ['title', 'artist']})
    }
    searchItems($event) {
        this.query = $event.target.value;
        this.results = this.fuse.search(this.query);
    }
    hide(query) {
        this.viewCtrl.dismiss(query);
    }
}

