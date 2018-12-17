import { ResizeIFrameChildDirective } from './unit-check/resize-IFrameChild/resize-IFrameChild.directive';
import { SyscheckDataService } from './syscheck-data.service';
import { BackendService } from './backend.service';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { SysCheckRoutingModule } from './sys-check-routing.module';
import { StartComponent } from './start.component';
import { RunComponent } from './run.component';
import { FlexLayoutModule } from '@angular/flex-layout';
import { MatButtonModule, MatCheckboxModule, MatMenuModule, MatTooltipModule, MatCardModule, MatStepperModule,
  MatToolbarModule, MatIconModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatSelectModule,
  MatTabsModule, MatProgressSpinnerModule } from '@angular/material';
import {MatDividerModule} from '@angular/material/divider';
import {MatListModule} from '@angular/material/list';
import { ReactiveFormsModule } from '@angular/forms';

import { EnvironmentCheckComponent } from './environment-check/environment-check.component';
import { NetworkCheckComponent } from './network-check/network-check.component';
import { UnitCheckComponent } from './unit-check/unit-check.component';
import { QuestionnaireComponent } from './questionnaire/questionnaire.component';
import { ReportComponent } from './report/report.component';

@NgModule({
  imports: [
    CommonModule,
    MatCardModule,
    FlexLayoutModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatInputModule,
    SysCheckRoutingModule,
    MatProgressSpinnerModule,
    MatStepperModule,
    MatButtonModule,
    MatDividerModule,
    MatListModule,
    MatSelectModule,
    ReactiveFormsModule
  ],
  declarations: [
    StartComponent,
    RunComponent,
    EnvironmentCheckComponent,
    NetworkCheckComponent,
    UnitCheckComponent,
    QuestionnaireComponent,
    ResizeIFrameChildDirective,
    ReportComponent],
  exports: [
    StartComponent
  ],
  providers: [
    BackendService,
    SyscheckDataService
  ]
})
export class SysCheckModule { }
