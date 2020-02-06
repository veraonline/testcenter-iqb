import { GetFileResponseData, CheckWorkspaceResponseData, BookletsStarted, SysCheckStatistics,
  ReviewData, LogData, UnitResponse, ResultData, MonitorData } from './workspace.interfaces';
import {Injectable, Inject} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ErrorHandler, ServerError } from 'iqb-components';

@Injectable()

export class BackendService {
  private serverUrlSlim = '';

  constructor(
    @Inject('SERVER_URL') private readonly serverUrl: string,
    private http: HttpClient) {

    this.serverUrlSlim = this.serverUrl + 'php/ws.php/';
    this.serverUrl = this.serverUrl + 'php/';
  }


  getFiles(): Observable<GetFileResponseData[] | ServerError> {
    return this.http
      .get<GetFileResponseData[]>(this.serverUrlSlim + 'filelist')
        .pipe(
          catchError(ErrorHandler.handle)
        );
  }

  deleteFiles(filesToDelete: Array<string>): Observable<string | ServerError> {
    return this.http
      .post<string>(this.serverUrlSlim + 'delete', {f: filesToDelete})
        .pipe(
          catchError(ErrorHandler.handle)
        );
  }

  checkWorkspace(): Observable<CheckWorkspaceResponseData | ServerError> {
    return this.http
      .post<CheckWorkspaceResponseData>(this.serverUrl + 'checkWorkspace.php', {})
        .pipe(
          catchError(ErrorHandler.handle)
        );
  }

  getBookletsStarted(groups: string[]): Observable<BookletsStarted[] | ServerError> {
    return this.http
      .post<BookletsStarted[]>(this.serverUrl + 'getBookletsStarted.php', {g: groups})
        .pipe(
          catchError(ErrorHandler.handle)
        );
  }

  lockBooklets(groups: string[]): Observable<boolean | ServerError> {
    return this.http
      .post<boolean>(this.serverUrlSlim + 'lock', {g: groups})
        .pipe(
          catchError(ErrorHandler.handle)
        );
  }

  unlockBooklets(groups: string[]): Observable<boolean | ServerError> {
    return this.http
      .post<boolean>(this.serverUrlSlim + 'unlock', {g: groups})
        .pipe(
            catchError(ErrorHandler.handle)
          );
}

  getMonitorData(): Observable<MonitorData[] | ServerError> {
    return this.http
      .post<MonitorData[]>(this.serverUrl + 'getMonitorData.php', {})
        .pipe(
          catchError(ErrorHandler.handle)
        );
}

  getResultData(): Observable<ResultData[]> {
    return this.http
      .post<ResultData[]>(this.serverUrl + 'getResultData.php', {})
        .pipe(
          catchError(() => [])
        );
  }

  getResponses(groups: string[]): Observable<UnitResponse[]> {
    return this.http
      .post<UnitResponse[]>(this.serverUrl + 'getResponses.php', {g: groups})
        .pipe(
          catchError(() => [])
        );
  }

  getLogs(groups: string[]): Observable<LogData[]> {
    return this.http
      .post<LogData[]>(this.serverUrl + 'getLogs.php', {g: groups})
        .pipe(
          catchError(() => [])
        );
  }

  getReviews(groups: string[]): Observable<ReviewData[]> {
    return this.http
      .post<ReviewData[]>(this.serverUrl + 'getReviews.php', {g: groups})
        .pipe(
          catchError(() => [])
        );
  }

  deleteData(groups: string[]): Observable<boolean | ServerError> {
    return this.http
      .post<boolean>(this.serverUrl + 'deleteData.php', {g: groups})
        .pipe(
          catchError(ErrorHandler.handle)
        );
  }

  getSysCheckReportList(): Observable<SysCheckStatistics[] | ServerError> {
    return this.http
      .post<SysCheckStatistics[]>(this.serverUrl + 'getSysCheckReportList.php', {})
        .pipe(
          catchError(ErrorHandler.handle)
        );
  }

  getSysCheckReport(reports: string[], columnDelimiter: string,
                    quoteChar: string): Observable<string[] | ServerError> {
    return this.http
      .post<string[]>(this.serverUrl + 'getSysCheckReport.php',
        {r: reports, cd: columnDelimiter, q: quoteChar})
          .pipe(
            catchError(ErrorHandler.handle)
          );
  }

  deleteSysCheckReports(reports: string[]): Observable<boolean | ServerError> {
    return this.http
      .post<boolean>(this.serverUrl + 'deleteSysCheckReports.php',
        {r: reports})
          .pipe(
            catchError(ErrorHandler.handle)
          );
  }
}
