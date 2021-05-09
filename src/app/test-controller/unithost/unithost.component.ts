import { Subscription } from 'rxjs';
import {
  Component, HostListener, OnInit, OnDestroy
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { CustomtextService } from 'iqb-components';
import {
  PageData,
  TestStateKey,
  KeyValuePairString,
  WindowFocusState, PendingUnitData, StateReportEntry, UnitStateKey, UnitPlayerState
} from '../test-controller.interfaces';
import { BackendService } from '../backend.service';
import { TestControllerService } from '../test-controller.service';
import { MainDataService } from '../../maindata.service';

declare let srcDoc: any;

@Component({
  templateUrl: './unithost.component.html',
  styleUrls: ['./unithost.component.css']
})

export class UnithostComponent implements OnInit, OnDestroy {
  private iFrameHostElement: HTMLElement;
  private iFrameItemplayer: HTMLIFrameElement;
  private routingSubscription: Subscription = null;
  leaveWarning = false;

  unitTitle = '';
  showPageNav = false;

  private myUnitSequenceId = -1;
  private myUnitDbKey = '';

  private postMessageSubscription: Subscription = null;
  private itemplayerSessionId = '';
  private postMessageTarget: Window = null;
  private pendingUnitData: PendingUnitData = null;

  pageList: PageData[] = [];
  private knownPages: string[];

  constructor(
    public tcs: TestControllerService,
    private mds: MainDataService,
    public cts: CustomtextService,
    private bs: BackendService,
    private route: ActivatedRoute
  ) { }

  ngOnInit(): void {
    setTimeout(() => {
      this.postMessageSubscription = this.mds.postMessage$.subscribe((m: MessageEvent) => {
        const msgData = m.data;
        const msgType = msgData.type;
        let msgPlayerId = msgData.sessionId;
        if ((msgPlayerId === undefined) || (msgPlayerId === null)) {
          msgPlayerId = this.itemplayerSessionId;
        }

        if ((msgType !== undefined) && (msgType !== null)) {
          switch (msgType) {
            case 'vopReadyNotification':
              // TODO add apiVersion check
              // TODO respect linting moaning
              // eslint-disable-next-line no-case-declarations
              let pendingUnitDef = '';
              // eslint-disable-next-line no-case-declarations
              const pendingUnitDataToRestore: KeyValuePairString = {};
              if (this.pendingUnitData && this.pendingUnitData.playerId === msgPlayerId) {
                pendingUnitDef = this.pendingUnitData.unitDefinition;
                pendingUnitDataToRestore.all = this.pendingUnitData.unitState;
                this.pendingUnitData = null;
              }
              if (this.tcs.testMode.saveResponses) {
                this.bs.updateUnitState(this.tcs.testId, this.myUnitDbKey, [<StateReportEntry>{
                  key: UnitStateKey.PLAYER, timeStamp: Date.now(), content: UnitPlayerState.RUNNING
                }]);
              }
              this.postMessageTarget = m.source as Window;
              if (typeof this.postMessageTarget !== 'undefined') {
                this.postMessageTarget.postMessage({
                  type: 'vopStartCommand',
                  sessionId: this.itemplayerSessionId,
                  unitDefinition: pendingUnitDef,
                  unitState: {
                    dataParts: pendingUnitDataToRestore
                  },
                  playerConfig: {
                    logPolicy: this.tcs.bookletConfig.logPolicy,
                    unitNumber: this.myUnitSequenceId,
                    unitTitle: this.unitTitle,
                    unitId: this.myUnitDbKey,
                    unitCount: this.tcs.maxUnitSequenceId,
                    stateReportPolicy: this.tcs.bookletConfig.stateReportPolicy,
                    pagingMode: this.tcs.bookletConfig.pagingMode
                  }
                }, '*');
              }
              break;

            case 'vopStateChangedNotification':
              if (msgPlayerId === this.itemplayerSessionId) {
                if (msgData.playerState) {
                  const { playerState } = msgData;
                  this.setPageList(Object.keys(playerState.validPages), playerState.currentPage);
                  if (typeof playerState.currentPage !== 'undefined') {
                    const pageId = playerState.currentPage;
                    const pageNr = this.knownPages.indexOf(playerState.currentPage) + 1;
                    const pageCount = this.knownPages.length;
                    if (this.knownPages.length > 1 && this.knownPages.indexOf(playerState.currentPage) >= 0) {
                      this.tcs.newUnitStatePage(this.myUnitDbKey, pageNr, pageId, pageCount);
                    }
                  }
                }
                if (msgData.unitState) {
                  const { unitState } = msgData;
                  const { presentationProgress } = unitState;
                  if (presentationProgress) {
                    this.tcs.updateUnitStatePresentationProgress(this.myUnitDbKey,
                      this.myUnitSequenceId, presentationProgress);
                  }
                  const { responseProgress } = unitState;
                  if (responseProgress) {
                    this.tcs.newUnitStateResponseProgress(this.myUnitDbKey, this.myUnitSequenceId, responseProgress);
                  }
                  const unitData = unitState.dataParts;
                  if (unitData) {
                    const dataPartsAllString = unitData.all;
                    if (dataPartsAllString) {
                      this.tcs.newUnitStateData(this.myUnitDbKey, this.myUnitSequenceId, dataPartsAllString,
                        unitState.unitStateDataType);
                    }
                  }
                }
                if (msgData.log) {
                  this.bs.addUnitLog(this.tcs.testId, this.myUnitDbKey, msgData.log);
                }
              }
              break;

            case 'vopUnitNavigationRequestedNotification':
              if (msgPlayerId === this.itemplayerSessionId) {
                this.tcs.setUnitNavigationRequest(msgData.targetRelative);
              }
              break;

            case 'vopWindowFocusChangedNotification':
              if (msgData.hasFocus) {
                this.tcs.windowFocusState$.next(WindowFocusState.PLAYER);
              } else if (document.hasFocus()) {
                this.tcs.windowFocusState$.next(WindowFocusState.HOST);
              } else {
                this.tcs.windowFocusState$.next(WindowFocusState.UNKNOWN);
              }
              break;

            default:
              console.log(`processMessagePost ignored message: ${msgType}`);
              break;
          }
        }
      });

      this.iFrameHostElement = <HTMLElement>document.querySelector('#iFrameHost');

      this.iFrameItemplayer = null;
      this.leaveWarning = false;

      this.routingSubscription = this.route.params.subscribe(params => {
        this.myUnitSequenceId = Number(params.u);
        this.mds.appSubTitle$.next(`Aufgabe ${this.myUnitSequenceId}`);
        this.tcs.currentUnitSequenceId = this.myUnitSequenceId;

        while (this.iFrameHostElement.hasChildNodes()) {
          this.iFrameHostElement.removeChild(this.iFrameHostElement.lastChild);
        }

        if ((this.myUnitSequenceId >= 1) && (this.tcs.rootTestlet !== null)) {
          const currentUnit = this.tcs.rootTestlet.getUnitAt(this.myUnitSequenceId);
          this.unitTitle = currentUnit.unitDef.title;
          this.myUnitDbKey = currentUnit.unitDef.alias;
          if (this.tcs.testMode.saveResponses) {
            this.bs.updateTestState(this.tcs.testId, [<StateReportEntry>{
              key: TestStateKey.CURRENT_UNIT_ID, timeStamp: Date.now(), content: this.myUnitDbKey
            }]);
            this.bs.updateUnitState(this.tcs.testId, this.myUnitDbKey, [<StateReportEntry>{
              key: UnitStateKey.PLAYER, timeStamp: Date.now(), content: UnitPlayerState.LOADING
            }]);
          }
          this.tcs.currentUnitDbKey = this.myUnitDbKey;
          this.tcs.currentUnitTitle = this.unitTitle;
          this.itemplayerSessionId = Math.floor(Math.random() * 20000000 + 10000000).toString();

          this.setPageList([], '');

          this.iFrameItemplayer = <HTMLIFrameElement>document.createElement('iframe');
          // this.iFrameItemplayer.setAttribute('srcdoc', this.tcs.getPlayer(currentUnit.unitDef.playerId));
          this.iFrameItemplayer.setAttribute('sandbox', 'allow-forms allow-scripts allow-same-origin');
          this.iFrameItemplayer.setAttribute('class', 'unitHost');
          this.iFrameItemplayer.setAttribute('height', String(this.iFrameHostElement.clientHeight - 5));

          this.pendingUnitData = {
            playerId: this.itemplayerSessionId,
            unitDefinition: this.tcs.hasUnitDefinition(this.myUnitSequenceId) ?
              this.tcs.getUnitDefinition(this.myUnitSequenceId) : null,
            unitState: this.tcs.hasUnitStateData(this.myUnitSequenceId) ?
              this.tcs.getUnitStateData(this.myUnitSequenceId) : null
          };
          this.leaveWarning = false;
          this.iFrameHostElement.appendChild(this.iFrameItemplayer);
          srcDoc.set(this.iFrameItemplayer, this.tcs.getPlayer(currentUnit.unitDef.playerId));
        }
      });
    });
  }

  @HostListener('window:resize')
  onResize(): any {
    if (this.iFrameItemplayer && this.iFrameHostElement) {
      const divHeight = this.iFrameHostElement.clientHeight;
      this.iFrameItemplayer.setAttribute('height', String(divHeight - 5));
      // TODO: Why minus 5px?
    }
  }

  setPageList(validPages: string[], currentPage: string): void {
    if ((validPages instanceof Array)) {
      this.knownPages = validPages.length ? validPages : [];
      const newPageList: PageData[] = [];
      if (validPages.length > 1) {
        for (let i = 0; i < validPages.length; i++) {
          if (i === 0) {
            newPageList.push({
              index: -1,
              id: '#previous',
              disabled: validPages[i] === currentPage,
              type: '#previous'
            });
          }

          newPageList.push({
            index: i + 1,
            id: validPages[i],
            disabled: validPages[i] === currentPage,
            type: '#goto'
          });

          if (i === validPages.length - 1) {
            newPageList.push({
              index: -1,
              id: '#next',
              disabled: validPages[i] === currentPage,
              type: '#next'
            });
          }
        }
      }
      this.pageList = newPageList;
    } else if ((this.pageList.length > 1) && (currentPage !== undefined)) {
      let currentPageIndex = 0;
      for (let i = 0; i < this.pageList.length; i++) {
        if (this.pageList[i].type === '#goto') {
          if (this.pageList[i].id === currentPage) {
            this.pageList[i].disabled = true;
            currentPageIndex = i;
          } else {
            this.pageList[i].disabled = false;
          }
        }
      }
      if (currentPageIndex === 1) {
        this.pageList[0].disabled = true;
        this.pageList[this.pageList.length - 1].disabled = false;
      } else {
        this.pageList[0].disabled = false;
        this.pageList[this.pageList.length - 1].disabled = currentPageIndex === this.pageList.length - 2;
      }
    }
    this.showPageNav = this.pageList.length > 0;
  }

  gotoPage(action: string, index = 0): void {
    let nextPageId = '';
    // currentpage is detected by disabled-attribute of page
    if (action === '#next') {
      let currentPageIndex = 0;
      for (let i = 0; i < this.pageList.length; i++) {
        if ((this.pageList[i].index > 0) && (this.pageList[i].disabled)) {
          currentPageIndex = i;
          break;
        }
      }
      if ((currentPageIndex > 0) && (currentPageIndex < this.pageList.length - 2)) {
        nextPageId = this.pageList[currentPageIndex + 1].id;
      }
    } else if (action === '#previous') {
      let currentPageIndex = 0;
      for (let i = 0; i < this.pageList.length; i++) {
        if ((this.pageList[i].index > 0) && (this.pageList[i].disabled)) {
          currentPageIndex = i;
          break;
        }
      }
      if (currentPageIndex > 1) {
        nextPageId = this.pageList[currentPageIndex - 1].id;
      }
    } else if (action === '#goto') {
      if ((index > 0) && (index < this.pageList.length - 1)) {
        nextPageId = this.pageList[index].id;
      }
    } else if (index === 0) {
      // call from player
      nextPageId = action;
    }

    if (nextPageId.length > 0 && typeof this.postMessageTarget !== 'undefined') {
      this.postMessageTarget.postMessage({
        type: 'vopPageNavigationCommand',
        sessionId: this.itemplayerSessionId,
        target: nextPageId
      }, '*');
    }
  }

  ngOnDestroy(): void {
    if (this.routingSubscription !== null) {
      this.routingSubscription.unsubscribe();
    }
    if (this.postMessageSubscription !== null) {
      this.postMessageSubscription.unsubscribe();
    }
  }
}
