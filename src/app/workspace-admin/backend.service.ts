import { Injectable, Inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import {
  GetFileResponseData, SysCheckStatistics,
  ReviewData, LogData, UnitResponse, ResultData
} from './workspace.interfaces';
import { ApiError, WorkspaceData } from '../app.interfaces';

@Injectable({
  providedIn: 'root'
})
export class BackendService {
  constructor(
    @Inject('SERVER_URL') private readonly serverUrl: string,
    private http: HttpClient
  ) {
  }

  getWorkspaceData(workspaceId: string): Observable<WorkspaceData | number> {
    return this.http
      .get<WorkspaceData>(`${this.serverUrl}workspace/${workspaceId}`)
      .pipe(
        catchError((err: ApiError) => {
          console.warn(`getWorkspaceData Api-Error: ${err.code} ${err.info} `);
          return of(err.code);
        })
      );
  }

  getFiles(workspaceId: string): Observable<GetFileResponseData> {
    return this.http
      .get<GetFileResponseData>(`${this.serverUrl}workspace/${workspaceId}/files`)
      .pipe(
        catchError((err: ApiError) => {
          console.warn(`getFiles Api-Error: ${err.code} ${err.info} `);
          return [];
        })
      );
  }

  deleteFiles(workspaceId: string, filesToDelete: Array<string>): Observable<FileDeletionReport> {
    return this.http
      .request<FileDeletionReport>('delete', `${this.serverUrl}workspace/${workspaceId}/files`, { body: { f: filesToDelete } })
      .pipe(
        catchError((err: ApiError) => {
          console.warn(`deleteFiles Api-Error: ${err.code} ${err.info} `);
          return of(<FileDeletionReport> {
            deleted: [],
            not_allowed: [`deleteFiles Api-Error: ${err.code} ${err.info} `],
            did_not_exist: []
          });
        })
      );
  }

  getResultData(workspaceId: string): Observable<ResultData[]> {
    return this.http
      .get<ResultData[]>(`${this.serverUrl}workspace/${workspaceId}/results`, {})
      .pipe(
        catchError((err: ApiError) => {
          console.warn(`getResultData Api-Error: ${err.code} ${err.info} `);
          return [];
        })
      );
  }

  /**
   *
   * @param workspaceId
   * @param groups
   * @deprecated
   */
  getResponses(workspaceId: string, groups: string[]): Observable<UnitResponse[]> {
    return this.http
      .get<UnitResponse[]>(`${this.serverUrl}workspace/${workspaceId}/responses`, { params: { groups: groups.join(',') } })
      .pipe(
        catchError((err: ApiError) => {
          console.warn(`getResponses Api-Error: ${err.code} ${err.info} `);
          return [];
        })
      );
  }

  /**
   *
   * @param workspaceId
   * @param groups
   * @deprecated
   */
  getLogs(workspaceId: string, groups: string[]): Observable<LogData[]> {
    return this.http
      .get<LogData[]>(`${this.serverUrl}workspace/${workspaceId}/logs`, { params: { groups: groups.join(',') } })
      .pipe(
        catchError((err: ApiError) => {
          console.warn(`getLogs Api-Error: ${err.code} ${err.info} `);
          return [];
        })
      );
  }

  /**
   *
   * @param workspaceId
   * @param groups
   * @deprecated
   */
  getReviews(workspaceId: string, groups: string[]): Observable<ReviewData[]> {
    return this.http
      .get<ReviewData[]>(`${this.serverUrl}workspace/${workspaceId}/reviews`, { params: { groups: groups.join(',') } })
      .pipe(
        catchError((err: ApiError) => {
          console.warn(`getReviews Api-Error: ${err.code} ${err.info} `);
          return [];
        })
      );
  }

  deleteData(workspaceId: string, groups: string[]): Observable<boolean> {
    return this.http
      .request('delete', `${this.serverUrl}workspace/${workspaceId}/responses`, { body: { groups } })
      .pipe(
        map(() => true),
        catchError((err: ApiError) => {
          console.warn(`deleteData Api-Error: ${err.code} ${err.info} `);
          return of(false);
        })
      );
  }

  getSysCheckReportList(workspaceId: string): Observable<SysCheckStatistics[]> {
    return this.http
      .get<ReviewData[]>(`${this.serverUrl}workspace/${workspaceId}/sys-check/reports/overview`)
      .pipe(
        catchError((err: ApiError) => {
          console.warn(`getSysCheckReportList Api-Error: ${err.code} ${err.info} `);
          return [];
        })
      );
  }

  /**
   *
   * @param workspaceId
   * @param reports
   * @param enclosure
   * @param delimiter
   * @param lineEnding
   * @deprecated
   */
  getSysCheckReport(workspaceId: string, reports: string[], enclosure: string, delimiter: string, lineEnding: string)
    : Observable<Blob | boolean> {
    return this.http
      .get(`${this.serverUrl}workspace/${workspaceId}/sys-check/reports`,
        {
          params: {
            checkIds: reports.join(','),
            delimiter,
            enclosure,
            lineEnding
          },
          headers: {
            Accept: 'text/csv'
          },
          responseType: 'blob'
        })
      .pipe(
        catchError((err: ApiError) => {
          console.warn(`getSysCheckReport Api-Error: ${err.code} ${err.info} `);
          return of(false);
        })
      );
  }

  deleteSysCheckReports(workspaceId: string, checkIds: string[]): Observable <FileDeletionReport> {
    return this.http
      .request<FileDeletionReport>('delete', `${this.serverUrl}workspace/${workspaceId}/sys-check/reports`, { body: { checkIds } })
      .pipe(
        catchError((err: ApiError) => {
          console.warn(`deleteSysCheckReports Api-Error: ${err.code} ${err.info} `);
          return of(<FileDeletionReport> {
            deleted: [],
            not_allowed: [`deleteSysCheckReports Api-Error: ${err.code} ${err.info} `],
            did_not_exist: []
          });
        })
      );
  }

  getReports(workspaceId: string, reportType: string, reportIds: string[]) : Observable<Blob | boolean> {
    return this.http
      .get(`${this.serverUrl}workspace/${workspaceId}/reports`,
        {
          params: {
            type: reportType,
            ids: reportIds.join(','),
          },
          headers: {
            Accept: 'text/csv'
          },
          responseType: 'blob'
        })
      .pipe(
        catchError((err: ApiError) => {
          console.warn(`getReports Api-Error: ${err.code} ${err.info} `);
          return of(false);
        })
      );
  }

  downloadFile(workspaceId: string, fileType: string, fileName: string): Observable<Blob | boolean> {
    return this.http
      .get(`${this.serverUrl}workspace/${workspaceId}/file/${fileType}/${fileName}`, { responseType: 'blob' })
      .pipe(
        catchError((err: ApiError) => {
          console.warn(`downloadFile Api-Error: ${err.code} ${err.info} `);
          return of(false);
        })
      );
  }
}

export interface FileDeletionReport {
  deleted: string[];
  not_allowed: string[];
  did_not_exist: string[];
  was_used: string[];
}
