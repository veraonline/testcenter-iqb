import { Component, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { SelectionModel } from '@angular/cdk/collections';

import { ConfirmDialogComponent, ConfirmDialogData } from 'iqb-components';
import { BackendService } from '../backend.service';
import { WorkspaceDataService } from '../workspacedata.service';
import { ResultData } from '../workspace.interfaces';
import { MainDataService } from '../../maindata.service';

@Component({
  templateUrl: './results.component.html',
  styleUrls: ['./results.component.css']
})
export class ResultsComponent implements OnInit {
  displayedColumns: string[] = [
    'selectCheckbox', 'groupname', 'bookletsStarted', 'num_units_min', 'num_units_max', 'num_units_mean', 'lastchange'
  ];

  resultDataSource = new MatTableDataSource<ResultData>([]);
  // prepared for selection if needed sometime
  tableselectionCheckbox = new SelectionModel<ResultData>(true, []);

  @ViewChild(MatSort, { static: true }) sort: MatSort;

  constructor(
    private bs: BackendService,
    public wds: WorkspaceDataService,
    private deleteConfirmDialog: MatDialog,
    private mds: MainDataService,
    public snackBar: MatSnackBar
  ) { }

  ngOnInit(): void {
    setTimeout(() => {
      this.mds.setSpinnerOn();
      this.updateTable();
    });
  }

  updateTable(): void {
    this.tableselectionCheckbox.clear();
    if (this.wds.wsRole === 'MO') {
      this.resultDataSource = new MatTableDataSource<ResultData>([]);
      this.mds.setSpinnerOff();
    } else {
      this.bs.getResultData(this.wds.wsId).subscribe(
        (resultData: ResultData[]) => {
          this.resultDataSource = new MatTableDataSource<ResultData>(resultData);
          this.resultDataSource.sort = this.sort;
          this.mds.setSpinnerOff();
        }
      );
    }
  }

  isAllSelected(): boolean {
    const numSelected = this.tableselectionCheckbox.selected.length;
    const numRows = this.resultDataSource.data.length;
    return numSelected === numRows;
  }

  masterToggle(): void {
    this.isAllSelected() ?
      this.tableselectionCheckbox.clear() :
      this.resultDataSource.data.forEach(row => this.tableselectionCheckbox.select(row));
  }

  downloadResponsesCSV(): void {
    this.downloadCSVReport('response', 'iqb-testcenter-responses.csv');
  }

  downloadReviewsCSV(): void {
    this.downloadCSVReport('review', 'iqb-testcenter-reviews.csv');
  }

  downloadLogsCSV(): void {
    this.downloadCSVReport('log', 'iqb-testcenter-logs.csv');
  }

  downloadCSVReport(reportType: string, filename: string): void {
    if (this.tableselectionCheckbox.selected.length > 0) {
      const dataIds: string[] = [];

      this.tableselectionCheckbox.selected.forEach(element => {
        dataIds.push(element.groupname);
      });

      this.wds.downloadReport(dataIds, reportType, filename);

      this.tableselectionCheckbox.clear();
    }
  }

  deleteData(): void {
    if (this.tableselectionCheckbox.selected.length > 0) {
      const selectedGroups: string[] = [];
      this.tableselectionCheckbox.selected.forEach(element => {
        selectedGroups.push(element.groupname);
      });

      let prompt = 'Es werden alle Antwort- und Logdaten in der Datenbank für diese ';
      if (selectedGroups.length > 1) {
        prompt = prompt + selectedGroups.length + ' Gruppen ';
      } else {
        prompt = prompt + ' Gruppe "' + selectedGroups[0] + '" ';
      }

      const dialogRef = this.deleteConfirmDialog.open(ConfirmDialogComponent, {
        width: '400px',
        data: <ConfirmDialogData>{
          title: 'Löschen von Gruppendaten',
          content: `${prompt}gelöscht. Fortsetzen?`,
          confirmbuttonlabel: 'Gruppendaten löschen',
          showcancel: true
        }
      });

      dialogRef.afterClosed().subscribe((result) => {
        if (result !== false) {
          this.mds.setSpinnerOn();
          this.bs.deleteData(this.wds.wsId, selectedGroups).subscribe((ok: boolean) => {
            if (ok) {
              this.snackBar.open('Löschen erfolgreich.', 'Ok.', { duration: 3000 });
            } else {
              this.snackBar.open('Löschen nicht erfolgreich.', 'Fehler', { duration: 3000 });
            }
            this.tableselectionCheckbox.clear();
            this.updateTable();
          });
        }
      });
    }
  }
}
