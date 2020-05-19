import {debounceTime, map, takeUntil} from 'rxjs/operators';
import {BehaviorSubject, interval, Subject, Subscription, timer} from 'rxjs';
import {Injectable} from '@angular/core';
import {MaxTimerData, Testlet} from './test-controller.classes';
import {
  KeyValuePairNumber,
  LastStateKey,
  LogEntryKey,
  MaxTimerDataType,
  TestStatus,
  UnitNaviButtonData,
  UnitNavigationTarget,
  UnitResponseData,
  UnitRestorePointData
} from './test-controller.interfaces';
import {BackendService} from './backend.service';
import {Router} from "@angular/router";
import {TestMode} from "../config/test-mode";
import {BookletConfig} from '../config/booklet-config';

@Injectable({
  providedIn: 'root'
})
export class TestControllerService {
  public testId = '';
  public testStatus$ = new BehaviorSubject<TestStatus>(TestStatus.WAITING_LOAD_START);
  public testStatusEnum = TestStatus;
  public loadComplete = false;

  public testMode = new TestMode();
  public bookletConfig = new BookletConfig();
  public rootTestlet: Testlet = null;
  public maxUnitSequenceId = 0;
  public minUnitSequenceId = 0;

  public maxTimeTimer$ = new Subject<MaxTimerData>();
  public currentMaxTimerTestletId = '';
  private maxTimeIntervalSubscription: Subscription = null;

  private _currentUnitSequenceId: number;
  public currentUnitDbKey = '';
  public currentUnitTitle = '';
  public unitPrevEnabled = false;
  public unitNextEnabled = false;
  public unitListForNaviButtons: UnitNaviButtonData[] = [];

  public get currentUnitSequenceId(): number {
    return this._currentUnitSequenceId;
  }
  public set currentUnitSequenceId(v: number) {
    this.unitPrevEnabled = v > this.minUnitSequenceId;
    this.unitNextEnabled = v < this.maxUnitSequenceId;
    if (this.rootTestlet && (this.bookletConfig.unit_navibuttons !== 'OFF') ) {
      const myUnitListForNaviButtons: UnitNaviButtonData[] = [];
      for (let sequ = 1; sequ <= this.rootTestlet.getMaxSequenceId(); sequ++) {
        const myUnitData = this.rootTestlet.getUnitAt(sequ);
        if (myUnitData) {
          const disabled = (sequ < this.minUnitSequenceId) || (sequ > this.maxUnitSequenceId) || myUnitData.unitDef.locked;
          myUnitListForNaviButtons.push({
            sequenceId: sequ,
            shortLabel: myUnitData.unitDef.naviButtonLabel,
            longLabel: myUnitData.unitDef.title,
            testletLabel: myUnitData.testletLabel,
            disabled: disabled,
            isCurrent: sequ === v
          });
        }
      }
      this.unitListForNaviButtons = myUnitListForNaviButtons;
    }
    this._currentUnitSequenceId = v;
  }

  public LastMaxTimerState: KeyValuePairNumber = {};
   // ))))))))))))))))))))))))))))))))))))))))))))))))

  private players: {[filename: string]: string} = {};
  private unitDefinitions: {[sequenceId: number]: string} = {};
  private unitRestorePoints: {[sequenceId: number]: string} = {};
  private unitPresentationCompleteStates: {[sequenceId: number]: string} = {};

  private restorePointsToSave$ = new Subject<UnitRestorePointData>();
  private responsesToSave$ = new Subject<UnitResponseData>();

  constructor (
    private router: Router,
    private bs: BackendService
  ) {
    this.restorePointsToSave$.pipe(
      debounceTime(200)).subscribe(restorePoint => {
        this.bs.newUnitRestorePoint(this.testId, restorePoint.unitDbKey, Date.now(),
              JSON.stringify(restorePoint.restorePoint)).subscribe(ok => {
          if (!ok) {
            console.warn('newUnitRestorePoint failed');
          }
        });
      }
    );

    // -- -- -- -- -- -- -- -- -- -- -- -- -- --
    this.responsesToSave$.pipe(
      debounceTime(200)).subscribe(response => {
        this.bs.newUnitResponse(this.testId, Date.now(), response.unitDbKey,
              JSON.stringify(response.response), response.responseType).subscribe(ok => {
          if (!ok) {
            console.warn('newUnitResponse failed');
          }
        });
      }
    );
  }

  // 7777777777777777777777777777777777777777777777777777777777777777777777
  public resetDataStore() {
    this.players = {};
    this.unitDefinitions = {};
    this.unitRestorePoints = {};
    this.rootTestlet = null;
    this.maxUnitSequenceId = 0;
    this.currentUnitSequenceId = 0;
    this.currentUnitDbKey = '';
    this.currentUnitTitle = '';
    this.unitPrevEnabled = false;
    this.unitNextEnabled = false;
    if (this.maxTimeIntervalSubscription !== null) {
      this.maxTimeIntervalSubscription.unsubscribe();
      this.maxTimeIntervalSubscription = null;
    }
    this.currentMaxTimerTestletId = '';
    this.LastMaxTimerState = {};
    this.unitListForNaviButtons = [];
    // this.dataLoading = false; TODO set test status?
    // this.bookletLoadComplete = false;
  }

  // 7777777777777777777777777777777777777777777777777777777777777777777777
  // uppercase and add extension if not part
  public normaliseId(s: string, standardext = ''): string {
    s = s.trim().toUpperCase();
    s.replace(/\s/g, '_');
    if (standardext.length > 0) {
      standardext = standardext.trim().toUpperCase();
      standardext.replace(/\s/g, '_');
      standardext = '.' + standardext.replace('.', '');

      if (s.slice(-(standardext.length)) !== standardext) {
        s = s + standardext;
      }
    }
    return s;
  }

  // 7777777777777777777777777777777777777777777777777777777777777777777777
  public addPlayer (id: string, player: string) {
    this.players[this.normaliseId(id, 'html')] = player;
  }
  public hasPlayer (id: string): boolean {
    return this.players.hasOwnProperty(this.normaliseId(id, 'html'));
  }
  public getPlayer(id: string): string {
    return this.players[this.normaliseId(id, 'html')];
  }

  // 7777777777777777777777777777777777777777777777777777777777777777777777
  public addUnitDefinition (sequenceId: number, uDef: string) {
    this.unitDefinitions[sequenceId] = uDef;
  }
  public hasUnitDefinition (sequenceId: number): boolean {
    return this.unitDefinitions.hasOwnProperty(sequenceId);
  }
  public getUnitDefinition(sequenceId: number): string {
    return this.unitDefinitions[sequenceId];
  }

  // 7777777777777777777777777777777777777777777777777777777777777777777777
  // adding RestorePoint via newUnitRestorePoint below
  public hasUnitRestorePoint (sequenceId: number): boolean {
    return this.unitRestorePoints.hasOwnProperty(sequenceId);
  }
  public getUnitRestorePoint(sequenceId: number): string {
    return this.unitRestorePoints[sequenceId];
  }

  // 7777777777777777777777777777777777777777777777777777777777777777777777
  // adding PresentationComplete via newUnitStatePresentationComplete below
  public addUnitPresentationComplete (sequenceId: number, uPC: string) {
    this.unitPresentationCompleteStates[sequenceId] = uPC;
  }
  public hasUnitPresentationComplete (sequenceId: number): boolean {
    return this.unitPresentationCompleteStates.hasOwnProperty(sequenceId);
  }
  public getUnitPresentationComplete(sequenceId: number): string {
    return this.unitPresentationCompleteStates[sequenceId];
  }

  // 7777777777777777777777777777777777777777777777777777777777777777777777
  public addBookletLog(logKey: LogEntryKey, entry = '') {
    if (this.testMode.saveResponses) {
      const entryData =  entry.length > 0 ? logKey + ': ' + JSON.stringify(entry) : logKey;
      this.bs.addBookletLog(this.testId, Date.now(), entryData).subscribe(ok => {
        if (!ok) {
          console.warn('addBookletLog failed');
        }
      });
    }
  }
  public setBookletState(stateKey: LastStateKey, state: string) {
    if (this.testMode.saveResponses) {
      this.bs.setBookletState(this.testId, stateKey, state).subscribe(ok => {
        if (!ok) {
          console.warn('setBookletState failed');
        }
      });
    }
  }
  public addUnitLog(unitDbKey: string, logKey: LogEntryKey, entry = '') {
    if (this.testMode.saveResponses && this.testStatus$.getValue() === TestStatus.RUNNING) {
      this.bs.addUnitLog(this.testId, Date.now(), unitDbKey,
            entry.length > 0 ? logKey + ': ' + JSON.stringify(entry) : logKey).subscribe(ok => {
        if (!ok) {
          console.warn('addUnitLog failed');
        }
      });
    }
  }
  public newUnitResponse(unitDbKey: string, response: string, responseType: string) {
    if (this.testMode.saveResponses) {
      this.responsesToSave$.next({
        unitDbKey: unitDbKey,
        response: response,
        responseType: responseType
      });
    }
  }
  public newUnitRestorePoint(unitDbKey: string, unitSequenceId: number, restorePoint: string, postToServer: boolean) {
    this.unitRestorePoints[unitSequenceId] = restorePoint;
    if (postToServer && this.testMode.saveResponses) {
      this.restorePointsToSave$.next({
        unitDbKey: unitDbKey,
        restorePoint: restorePoint
      });
    }
  }
  public newUnitStatePresentationComplete(unitDbKey: string, unitSequenceId: number, presentationComplete: string) {
    this.unitPresentationCompleteStates[unitSequenceId] = presentationComplete;
    if (this.testMode.saveResponses) {
      this.addUnitLog(unitDbKey, LogEntryKey.PRESENTATIONCOMPLETE, presentationComplete);
      this.bs.setUnitState(this.testId, unitDbKey, LastStateKey.PRESENTATIONCOMPLETE, presentationComplete).subscribe(ok => {
        if (!ok) {
          console.warn('setUnitState failed');
        }
      });
    }
  }
  public newUnitStateResponsesGiven(unitDbKey: string, unitSequenceId: number, responsesGiven: string) {
    if (this.testMode.saveResponses) {
      this.addUnitLog(unitDbKey, LogEntryKey.RESPONSESCOMPLETE, responsesGiven);
    }
  }

  // 7777777777777777777777777777777777777777777777777777777777777777777777
  public startMaxTimer(testletId: string, timeLeftMinutes: number) {
    if (this.maxTimeIntervalSubscription !== null) {
      this.maxTimeIntervalSubscription.unsubscribe();
    }
    this.maxTimeTimer$.next(new MaxTimerData(timeLeftMinutes, testletId, MaxTimerDataType.STARTED));
    this.currentMaxTimerTestletId = testletId;
    this.maxTimeIntervalSubscription = interval(1000)
      .pipe(
        takeUntil(
          timer(timeLeftMinutes * 60 * 1000)
        ),
        map(val => (timeLeftMinutes * 60) - val - 1)
      ).subscribe(
        val => {
          this.maxTimeTimer$.next(new MaxTimerData(val / 60, testletId, MaxTimerDataType.STEP));
        },
        e => console.log('maxTime onError: %s', e),
        () => {
          this.maxTimeTimer$.next(new MaxTimerData(0, testletId, MaxTimerDataType.ENDED));
          this.currentMaxTimerTestletId = '';
        }
      );
  }

  public stopMaxTimer() {
    if (this.maxTimeIntervalSubscription !== null) {
      this.maxTimeIntervalSubscription.unsubscribe();
      this.maxTimeIntervalSubscription = null;
      this.maxTimeTimer$.next(new MaxTimerData(0, this.currentMaxTimerTestletId, MaxTimerDataType.CANCELLED));
    }
    this.currentMaxTimerTestletId = '';
  }

  public updateMinMaxUnitSequenceId(startWith: number) {
    if (this.rootTestlet) {
      this.minUnitSequenceId = this.rootTestlet.getFirstUnlockedUnitSequenceId(startWith);
      this.maxUnitSequenceId = this.rootTestlet.getLastUnlockedUnitSequenceId(startWith);
    }
  }

  public terminateTest() {
    if (this.testMode.saveResponses) {
      this.bs.addBookletLog(this.testId, Date.now(), 'BOOKLETLOCKEDbyTESTEE').subscribe(OK =>{
        // TODO who evaluates TestStatus when navigating to root?
        if (OK) {
          this.bs.lockBooklet(this.testId).subscribe(bsOk => {
            this.testStatus$.next(bsOk ? TestStatus.TERMINATED : TestStatus.ERROR);
            this.router.navigate(['/']);
          })
        } else {
          this.testStatus$.next(TestStatus.ERROR);
          this.router.navigate(['/']);
        }
      })
    } else {
      this.testStatus$.next(TestStatus.TERMINATED);
      this.router.navigate(['/']);
    }
  }

  public setUnitNavigationRequest(navString: string = UnitNavigationTarget.NEXT) {
    if (!this.rootTestlet) {
      this.router.navigateByUrl(`/t/${this.testId}`);
    } else {
      switch (navString) {
        case UnitNavigationTarget.MENU:
        case UnitNavigationTarget.ERROR:
        case UnitNavigationTarget.PAUSE:
          this.router.navigateByUrl(`/t/${this.testId}`);
          break;
        case UnitNavigationTarget.NEXT:
          let startWith = this.currentUnitSequenceId;
          if (startWith < this.minUnitSequenceId) {
            startWith = this.minUnitSequenceId - 1;
          }
          const nextUnitSequenceId = this.rootTestlet.getNextUnlockedUnitSequenceId(startWith);
          if (nextUnitSequenceId > 0) {
            this.router.navigateByUrl(`/t/${this.testId}/u/${nextUnitSequenceId}`);
          }
          break;
        case UnitNavigationTarget.PREVIOUS:
          this.router.navigateByUrl(`/t/${this.testId}/u/${this.currentUnitSequenceId - 1}`);
          break;
        case UnitNavigationTarget.FIRST:
          this.router.navigateByUrl(`/t/${this.testId}/u/${this.minUnitSequenceId}`);
          break;
        case UnitNavigationTarget.LAST:
          this.router.navigateByUrl(`/t/${this.testId}/u/${this.maxUnitSequenceId}`);
          break;
        case UnitNavigationTarget.END:
          this.terminateTest();
          break;

        default:
          this.router.navigateByUrl(`/t/${this.testId}/u/${navString}`);
          break;
      }
    }
  }
}
