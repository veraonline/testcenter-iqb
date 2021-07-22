import { TestBed, inject } from '@angular/core/testing';
import { HttpClientModule } from '@angular/common/http';

import { WorkspaceDataService } from './workspacedata.service';
import {Observable, of} from "rxjs";
import {MatDialog, MatDialogModule} from "@angular/material/dialog";

class MockMatDialog {
  open(): { afterClosed: () => Observable<{ action: boolean }> } {
    return {
      afterClosed: () => of({ action: true })
    };
  }
}

describe('WorkspaceDataService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientModule,
        MatDialogModule
      ],
      providers: [
        WorkspaceDataService,
        { provide: MatDialog, useValue: new MockMatDialog() },
      ]
    });
  });

  it('should be created', inject([WorkspaceDataService], (service: WorkspaceDataService) => {
    expect(service).toBeTruthy();
  }));
});
