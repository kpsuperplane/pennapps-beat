import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import * as firebase from 'firebase';

const config = {
  apiKey: "AIzaSyADhr7LmbwwlEQvK2N-azc5g3cayz9pY-0",
  authDomain: "pennapps-beat.firebaseapp.com",
  databaseURL: "https://pennapps-beat.firebaseio.com",
  projectId: "pennapps-beat",
  storageBucket: "pennapps-beat.appspot.com",
  messagingSenderId: "214382078002"
};
firebase.initializeApp(config);

/*
  Generated class for the FirebaseProvider provider.

  See https://angular.io/guide/dependency-injection for more info on providers
  and Angular DI.
*/
@Injectable()
export class FirebaseProvider {

  database = firebase.database();

  constructor(public http: HttpClient) {
  }

  createSession() { 
    const sessionRef = this.database.ref('sessions');
    const newSessionRef = sessionRef.push();
    const newUser = newSessionRef.child('users').push();
    newUser.set(true);
    return {session: newSessionRef.key, user: newUser.key};
  }

  joinSession(session: string) {
    const newUser = this.database.ref('sessions').child(session).child('users').push();
    newUser.set(true);
    return {session, user: newUser.key};
  }

}
