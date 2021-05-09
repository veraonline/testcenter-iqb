import { Component, OnDestroy, OnInit } from '@angular/core';
import { from, Subscription } from 'rxjs';
import { concatMap } from 'rxjs/operators';
import { Router } from '@angular/router';
import { CustomtextService } from 'iqb-components';
import { BackendService } from '../../backend.service';
import { MainDataService } from '../../maindata.service';
import { AuthAccessKeyType, AuthData, BookletData } from '../../app.interfaces';

@Component({
  templateUrl: './test-starter.component.html',
  styleUrls: ['./test-starter.component.css']
})
export class TestStarterComponent implements OnInit, OnDestroy {
  booklets: BookletData[] = [];
  openTestletsCount = 0;
  private getBookletDataSubscription: Subscription = null;
  bookletSelectTitle = 'Bitte wählen';
  problemText = '';

  constructor(
    private router: Router,
    private bs: BackendService,
    public cts: CustomtextService,
    private mds: MainDataService
  ) { }

  ngOnInit(): void {
    setTimeout(() => {
      this.mds.setSpinnerOn();
      this.bs.getSessionData().subscribe(authDataUntyped => {
        if (typeof authDataUntyped !== 'number') {
          const authData = authDataUntyped as AuthData;
          if (authData) {
            if (authData.token) {
              if (authData.access[AuthAccessKeyType.TEST]) {
                this.booklets = [];
                if (this.getBookletDataSubscription !== null) {
                  this.getBookletDataSubscription.unsubscribe();
                }
                this.getBookletDataSubscription = from(authData.access[AuthAccessKeyType.TEST])
                  .pipe(
                    concatMap(bookletId => this.bs.getBookletData(bookletId))
                  ).subscribe(
                    bData => {
                      this.booklets.push(bData);
                      if (!(bData as BookletData).locked) {
                        this.openTestletsCount += 1;
                      }
                    },
                    e => {
                      this.problemText = `Fehler in der Netzwerkverbindung (${e}).`;
                      this.mds.setSpinnerOff();
                    },
                    () => {
                      this.problemText = this.booklets.length ? '' : 'Für diese Anmeldung wurde kein Test gefunden.';
                      this.mds.setSpinnerOff();
                      if (this.openTestletsCount <= 0) {
                        this.mds.appSubTitle$.next(this.cts.getCustomText('login_bookletSelectPromptNull'));
                      } else if (this.openTestletsCount === 1) {
                        this.mds.appSubTitle$.next(this.cts.getCustomText('login_bookletSelectPromptOne'));
                      } else {
                        this.mds.appSubTitle$.next(this.cts.getCustomText('login_bookletSelectPromptMany'));
                      }
                    }
                  );
              }
              this.mds.setAuthData(authData);
            } else {
              this.mds.setAuthData();
              this.mds.setSpinnerOff();
            }
          } else {
            this.mds.setAuthData();
            this.mds.setSpinnerOff();
          }
        } else {
          this.mds.setSpinnerOff();
        }
      });
    });
  }

  startTest(b: BookletData): void {
    this.bs.startTest(b.id).subscribe(testId => {
      if (typeof testId === 'number') {
        const errCode = testId as number;
        if (errCode === 423) {
          this.problemText = 'Dieser Test ist gesperrt';
        } else {
          this.problemText = `Problem beim Start (${errCode})`;
        }
      } else {
        this.router.navigate(['/t', testId]);
      }
    });
  }

  resetLogin(): void {
    this.mds.setAuthData();
    this.router.navigate(['/']);
  }

  ngOnDestroy(): void {
    if (this.getBookletDataSubscription !== null) {
      this.getBookletDataSubscription.unsubscribe();
    }
  }
}
