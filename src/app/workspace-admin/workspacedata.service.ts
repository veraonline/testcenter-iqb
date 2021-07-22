import { Injectable } from '@angular/core';
import { MatDialog } from "@angular/material/dialog";
import { MatSnackBar } from "@angular/material/snack-bar";

import { saveAs } from "file-saver";

import { MainDataService } from "../maindata.service";
import { BackendService } from './backend.service';

@Injectable({
  providedIn: 'root'
})

@Injectable()
export class WorkspaceDataService {
  public wsId: string;
  public wsRole = 'RW';
  public wsName = '';

  constructor(
    private bs: BackendService,
    private deleteConfirmDialog: MatDialog,
    private mds: MainDataService,
    public snackBar: MatSnackBar
  ) { }

  downloadReport(dataIds: string[], reportType: string, filename: string): void {
      this.mds.setSpinnerOn();

      this.bs.getReports(this.wsId, reportType, dataIds).subscribe((response) => {
        const errorMessage: string = 'Keine Daten verfügbar.';
        const errorType: string = 'Fehler';
        const errorDisplayDuration: number = 3000;

        this.mds.setSpinnerOff();

        if (response === false) {
          this.snackBar.open(errorMessage, errorType, {duration: errorDisplayDuration});

        } else {
          const reportData = response as Blob;

          if (reportData.size > 0) {
            saveAs(reportData, filename);

          } else {
            this.snackBar.open(errorMessage, errorType, {duration: errorDisplayDuration});
          }
        }
      });
  }

}
