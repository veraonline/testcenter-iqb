import { BackendService, MonitorData, BookletsStarted } from './../backend.service';
import { MainDatastoreService } from './../maindatastore.service';
import { Component, OnInit, ViewChild } from '@angular/core';
import { MatSnackBar, MatSort, MatTableDataSource } from '@angular/material';
import { SelectionModel } from '@angular/cdk/collections';
import { saveAs } from 'file-saver';


@Component({
  templateUrl: './monitor.component.html',
  styleUrls: ['./monitor.component.css']
})
export class MonitorComponent implements OnInit {

  displayedColumns: string[] = ['selectCheckbox', 'groupname', 'loginsPrepared',
          'personsPrepared', 'bookletsPrepared', 'bookletsStarted', 'bookletsLocked'];
  private monitorDataSource = new MatTableDataSource<MonitorData>([]);
  private isAdmin = false;
  private tableselectionCheckbox = new SelectionModel<MonitorData>(true, []);
  private dataLoading = false;
  @ViewChild(MatSort) sort: MatSort;

  constructor(
    private bs: BackendService,
    private mds: MainDatastoreService,
    public snackBar: MatSnackBar
  ) {
    this.mds.isAdmin$.subscribe(
      i => this.isAdmin = i);
  }

  ngOnInit() {
    this.mds.adminToken$.subscribe(at => this.updateTable());
    this.mds.workspaceId$.subscribe(ws => this.updateTable());
  }

  updateTable() {
    this.dataLoading = true;
    this.tableselectionCheckbox.clear;
    this.bs.getMonitorData(this.mds.adminToken$.getValue(), this.mds.workspaceId$.getValue()).subscribe(
      (monitorData: MonitorData[]) => {
        this.dataLoading = false;
        this.monitorDataSource = new MatTableDataSource<MonitorData>(monitorData);
        this.monitorDataSource.sort = this.sort;
      }
    )

  }

  isAllSelected() {
    const numSelected = this.tableselectionCheckbox.selected.length;
    const numRows = this.monitorDataSource.data.length;
    return numSelected === numRows;
  }

  masterToggle() {
    this.isAllSelected() ?
        this.tableselectionCheckbox.clear() :
        this.monitorDataSource.data.forEach(row => this.tableselectionCheckbox.select(row));
  }

  downloadCSV() {
    if (this.tableselectionCheckbox.selected.length > 0) {
      this.dataLoading = true;
      const selectedGroups: string[] = [];
      this.tableselectionCheckbox.selected.forEach(element => {
        selectedGroups.push(element.groupname);
      });
      this.bs.getBookletsStarted(
            this.mds.adminToken$.getValue(),
            this.mds.workspaceId$.getValue(),
            selectedGroups).subscribe(bData => {

          const bookletList = bData as BookletsStarted[];
          if (bookletList.length > 0) {
            const columnDelimiter = ';';
            const lineDelimiter = '\n';

            let myCsvData = 'groupname' + columnDelimiter + 'loginname' + columnDelimiter + 'code' + columnDelimiter +
                'bookletname' + columnDelimiter + 'locked' + lineDelimiter;
            bookletList.forEach((b: BookletsStarted) => {
               myCsvData += '"' + b.groupname + '"' + columnDelimiter + '"' + b.loginname + '"' + columnDelimiter + '"' + b.code + '"' + columnDelimiter +
                '"' + b.bookletname + '"' + columnDelimiter + '"' + (b.locked ? 'X' : '-') + '"' + lineDelimiter;
            });
            var blob = new Blob([myCsvData], {type: "text/csv;charset=utf-8"});
            saveAs(blob, "iqb-testcenter-bookletsStarted.csv");
          } else {
            this.snackBar.open('Keine Daten verfügbar.', 'Fehler', {duration: 3000});
          }

          this.tableselectionCheckbox.clear();
          this.dataLoading = false;
        }
      );
    }
  }

  lock() {
    if (this.tableselectionCheckbox.selected.length > 0) {
      this.dataLoading = true;
      const selectedGroups: string[] = [];
      this.tableselectionCheckbox.selected.forEach(element => {
        selectedGroups.push(element.groupname);
      });
      this.bs.lockBooklets(
            this.mds.adminToken$.getValue(),
            this.mds.workspaceId$.getValue(),
            selectedGroups).subscribe(success => {
              const ok = success as boolean;
              if (ok) {
                this.snackBar.open('Testhefte wurden gesperrt.', 'Sperrung', {duration: 1000});
              } else {
                this.snackBar.open('Testhefte konnten nicht gesperrt werden.', 'Fehler', {duration: 3000});
              }
            });
            this.dataLoading = false;
            this.updateTable();
          }
  }

  unlock() {
    if (this.tableselectionCheckbox.selected.length > 0) {
      this.dataLoading = true;
      const selectedGroups: string[] = [];
      this.tableselectionCheckbox.selected.forEach(element => {
        selectedGroups.push(element.groupname);
      });
      this.bs.unlockBooklets(
            this.mds.adminToken$.getValue(),
            this.mds.workspaceId$.getValue(),
            selectedGroups).subscribe(success => {
              const ok = success as boolean;
              if (ok) {
                this.snackBar.open('Testhefte wurden freigegeben.', 'Sperrung', {duration: 1000});
              } else {
                this.snackBar.open('Testhefte konnten nicht freigegeben werden.', 'Fehler', {duration: 3000});
              }
            });
            this.dataLoading = false;
            this.updateTable();
          }
  }
}
