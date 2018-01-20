import { BrowserModule } from '@angular/platform-browser';
import { ErrorHandler, NgModule } from '@angular/core';
import { IonicApp, IonicErrorHandler, IonicModule } from 'ionic-angular';
import { SplashScreen } from '@ionic-native/splash-screen';
import { StatusBar } from '@ionic-native/status-bar';


import { MyApp } from './app.component';
import { HomePage } from '../pages/home/home';
import { FirebaseProvider } from '../providers/firebase/firebase';
import { HttpClientModule } from '@angular/common/http';
import { GamePage } from '../pages/game/game';
import { QRCodeModule } from 'angular2-qrcode';
import { BarcodeScanner } from '@ionic-native/barcode-scanner';
import { SearchPage } from '../pages/game/search/search';
import { YoutubeProvider } from '../providers/youtube/youtube';

@NgModule({
  declarations: [
    MyApp,
    HomePage,
    GamePage,
    SearchPage  
  ],
  imports: [
    BrowserModule,
    HttpClientModule,   
    QRCodeModule,
    IonicModule.forRoot(MyApp)
  ],
  bootstrap: [IonicApp],
  entryComponents: [
    MyApp,
    HomePage,
    GamePage,
    SearchPage
  ],
  providers: [
    StatusBar,
    BarcodeScanner,
    SplashScreen,
    {provide: ErrorHandler, useClass: IonicErrorHandler},
    FirebaseProvider,
    YoutubeProvider
  ]
})
export class AppModule {}
