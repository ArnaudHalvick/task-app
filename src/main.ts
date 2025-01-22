import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { provideAnimations } from '@angular/platform-browser/animations';
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { getAuth, provideAuth } from '@angular/fire/auth';
import { getFirestore, provideFirestore } from '@angular/fire/firestore';

bootstrapApplication(AppComponent, {
  providers: [
    provideAnimations(), provideFirebaseApp(() => initializeApp({ projectId: "ng-task-app", appId: "1:629509554495:web:2e7cb65efd3b51f8d0138a", storageBucket: "ng-task-app.firebasestorage.app", apiKey: "AIzaSyAWzsyJkliH8bkCq1xsoY2SCVtU2TcMzgs", authDomain: "ng-task-app.firebaseapp.com", messagingSenderId: "629509554495" })), provideAuth(() => getAuth()), provideFirestore(() => getFirestore())
    // Add other providers here if needed
  ]
}).catch(err => console.error(err));
