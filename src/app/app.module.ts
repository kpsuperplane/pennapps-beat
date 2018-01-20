import { BrowserModule } from '@angular/platform-browser';
import { ErrorHandler, NgModule } from '@angular/core';
import { IonicApp, IonicErrorHandler, IonicModule } from 'ionic-angular';
import { SplashScreen } from '@ionic-native/splash-screen';
import { StatusBar } from '@ionic-native/status-bar';
import { QRScanner, QRScannerStatus } from '@ionic-native/qr-scanner';


import { MyApp } from './app.component';
import { HomePage } from '../pages/home/home';
import { FirebaseProvider } from '../providers/firebase/firebase';
import { HttpClientModule } from '@angular/common/http';
import { GamePage } from '../pages/game/game';
import { QRCodeModule } from 'angular2-qrcode';

@NgModule({
  declarations: [
    MyApp,
    HomePage,
    GamePage
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
    GamePage
  ],
  providers: [
    StatusBar,
    SplashScreen,
<<<<<<< HEAD
    QRScanner,
    {provide: ErrorHandler, useClass: IonicErrorHandler}
=======
    {provide: ErrorHandler, useClass: IonicErrorHandler},
    FirebaseProvider
>>>>>>> 25d30c1b4266213b926903f49a71ac774c5bcd9c
  ]
})
export class AppModule {}
