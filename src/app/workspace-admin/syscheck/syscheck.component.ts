import { Component, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { SelectionModel } from '@angular/cdk/collections';

import { ConfirmDialogComponent, ConfirmDialogData } from 'iqb-components';

import { BackendService } from '../backend.service';
import { SysCheckStatistics } from '../workspace.interfaces';
import { MainDataService } from '../../maindata.service';
import { WorkspaceDataService } from "../workspacedata.service";

@Component({
  templateUrl: './syscheck.component.html',
  styleUrls: ['./syscheck.component.css']
})
export class SyscheckComponent implements OnInit {
  displayedColumns: string[] = ['selectCheckbox', 'syscheckLabel', 'number', 'details-os', 'details-browser'];
  public resultDataSource = new MatTableDataSource<SysCheckStatistics>([]);
  // prepared for selection if needed sometime
  public tableselectionCheckbox = new SelectionModel<SysCheckStatistics>(true, []);

  @ViewChild(MatSort, { static: true }) sort: MatSort;

  constructor(
    private bs: BackendService,
    public wds: WorkspaceDataService,
    private deleteConfirmDialog: MatDialog,
    private mds: MainDataService,
    public snackBar: MatSnackBar
  ) {
  }

  ngOnInit(): void {
    setTimeout(() => {
      this.mds.setSpinnerOn();
      this.updateTable();
    });
  }

  updateTable(): void {
    this.tableselectionCheckbox.clear();
    this.bs.getSysCheckReportList(this.wds.wsId).subscribe(
      (resultData: SysCheckStatistics[]) => {
        this.resultDataSource = new MatTableDataSource<SysCheckStatistics>(resultData);
        this.resultDataSource.sort = this.sort;
        this.mds.setSpinnerOff();
      }
    );
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

  downloadReportsCSV(): void {
    if (this.tableselectionCheckbox.selected.length > 0) {
      const dataIds: string[] = [];
      this.tableselectionCheckbox.selected.forEach(element => {
        dataIds.push(element.id);
      });

      this.wds.downloadReport(dataIds, 'systemCheck', 'iqb-testcenter-syscheckreports.csv');

      this.tableselectionCheckbox.clear();
    }
  }

  deleteReports() {
    if (this.tableselectionCheckbox.selected.length > 0) {
      const selectedReports: string[] = [];
      this.tableselectionCheckbox.selected.forEach((element) => {
        selectedReports.push(element.id);
      });

      let prompt = 'Es werden alle Berichte für diese';
      if (selectedReports.length > 1) {
        prompt = `${prompt} ${selectedReports.length} System-Checks `;
      } else {
        prompt = prompt + 'n System-Check "' + selectedReports[0] + '" ';
      }

      const dialogRef = this.deleteConfirmDialog.open(ConfirmDialogComponent, {
        width: '400px',
        data: <ConfirmDialogData>{
          title: 'Löschen von Berichten',
          content: `${prompt}gelöscht. Fortsetzen?`,
          confirmbuttonlabel: 'Berichtsdaten löschen',
          showcancel: true
        }
      });

      dialogRef.afterClosed().subscribe((result) => {
        if (result !== false) {
          this.mds.setSpinnerOn();
          this.bs.deleteSysCheckReports(this.wds.wsId, selectedReports).subscribe((fileDeletionReport) => {
            const message = [];
            if (fileDeletionReport.deleted.length > 0) {
              message.push(`${fileDeletionReport.deleted.length} Berichte erfolgreich gelöscht.`);
            }
            if (fileDeletionReport.not_allowed.length > 0) {
              message.push(`${fileDeletionReport.not_allowed.length} Berichte konnten nicht gelöscht werden.`);
            }
            this.snackBar.open(message.join('<br>'), message.length > 1 ? 'Achtung' : '', { duration: 1000 });
            this.updateTable();
          });
        }
      });
    }
  }
}
