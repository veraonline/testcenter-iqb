import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';
import { CustomtextService } from 'iqb-components';
import {
  AppError,
  AuthData, KeyValuePairs
} from './app.interfaces';
import { BackendService } from './backend.service';
import { AppConfig, localStorageTestConfigKey } from './config/app.config';

const localStorageAuthDataKey = 'iqb-tc-a';

@Injectable({
  providedIn: 'root'
})

export class MainDataService {
  appError$ = new Subject<AppError>();
  errorReportingSilent = false;
  isSpinnerOn$ = new BehaviorSubject<boolean>(false);
  appTitle$ = new BehaviorSubject<string>('IQB-TestcenterX');
  appSubTitle$ = new BehaviorSubject<string>('');
  progressVisualEnabled = true;
  appConfig: AppConfig = null;
  sysCheckAvailable = false;

  defaultTcHeaderHeight = document.documentElement.style.getPropertyValue('--tc-header-height');
  defaultTcUnitTitleHeight = document.documentElement.style.getPropertyValue('--tc-unit-title-height');
  defaultTcUnitPageNavHeight = document.documentElement.style.getPropertyValue('--tc-unit-page-nav-height');

  // set by app.component.ts
  postMessage$ = new Subject<MessageEvent>();
  appWindowHasFocus$ = new Subject<boolean>();

  static getAuthData(): AuthData {
    let myReturn: AuthData = null;
    const storageEntry = localStorage.getItem(localStorageAuthDataKey);
    if (storageEntry !== null) {
      if (storageEntry.length > 0) {
        try {
          myReturn = JSON.parse(storageEntry as string);
        } catch (e) {
          console.warn('corrupt localStorage authData entry');
          myReturn = null;
        }
      }
    }
    return myReturn;
  }

  static resetAuthData(): void {
    const storageEntry = localStorage.getItem(localStorageAuthDataKey);
    if (storageEntry) {
      localStorage.removeItem(localStorageAuthDataKey);
    }
  }

  static getTestConfig(): KeyValuePairs {
    let myReturn: KeyValuePairs = null;
    const storageEntry = localStorage.getItem(localStorageTestConfigKey);
    if (storageEntry !== null) {
      if (storageEntry.length > 0) {
        try {
          myReturn = JSON.parse(storageEntry as string);
        } catch (e) {
          console.warn('corrupt localStorage testConfig entry');
          myReturn = null;
        }
      }
    }
    return myReturn;
  }

  constructor(
    private bs: BackendService,
    private cts: CustomtextService
  ) { }

  setSpinnerOn(): void {
    this.isSpinnerOn$.next(true);
  }

  setSpinnerOff(): void {
    this.isSpinnerOn$.next(false);
  }

  setAuthData(authData: AuthData = null): void {
    if (authData) {
      if (authData.customTexts) {
        this.cts.addCustomTexts(authData.customTexts);
      }
      localStorage.setItem(localStorageAuthDataKey, JSON.stringify(authData));
    } else {
      localStorage.removeItem(localStorageAuthDataKey);
    }
  }
}
