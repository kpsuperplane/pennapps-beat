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

  createSession(name: string) { 
    const sessionRef = this.database.ref('sessions');
    const newSessionRef = sessionRef.push();
    const newUserKey = newSessionRef.child('users').push().key;
    return new Promise((resolve, reject) => {
      newSessionRef.set({
        name,
        users: {
          [newUserKey]: true
        }
      }).then(() => {
        resolve({sessionId: newSessionRef.key, user: newUserKey});
      });
    });
  }

  getSession(sessionId: string) {
    return this.database.ref('sessions').child(sessionId);
  }

  joinSession(sessionId: string) {
    const newUser = this.database.ref('sessions').child(sessionId).child('users').push();
    newUser.set(true);
    return {sessionId, user: newUser.key};
  }

}
