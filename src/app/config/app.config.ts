import { CustomtextService } from 'iqb-components';
import { SafeUrl } from '@angular/platform-browser';
import { Inject } from '@angular/core';
import customTextsDefault from './custom-texts.json';
import { KeyValuePairs } from '../app.interfaces';

export interface SysConfig {
  customTexts: KeyValuePairs;
  version: string;
  mainLogo: string;
  testConfig: KeyValuePairs;
  broadcastingService: BroadCastingServiceInfo;
  app_title: string;
  background_color: string;
  intro_html: string;
  impressum_html: string;
  global_warning: string;
  global_warning_expired_day: Date;
  global_warning_expired_hour: number;
}

export interface BroadCastingServiceInfo {
  status: string;
  version?: string;
  versionExpected?: string;
}

export const localStorageTestConfigKey = 'iqb-tc-c';

export class AppConfig {
  customTexts: KeyValuePairs;
  detectedApiVersion: string;
  mainLogo: string;
  testConfig: KeyValuePairs;
  broadcastingService: BroadCastingServiceInfo = { status: 'none' };
  app_title: string;
  background_color: string;
  intro_html: string;
  trusted_intro_html: SafeUrl;
  impressum_html: string;
  trusted_impressum_html: SafeUrl;
  global_warning: string;
  global_warning_expired_day: Date;
  global_warning_expired_hour: number;
  isValidApiVersion: boolean;
  @Inject('API_VERSION_EXPECTED') private readonly expectedApiVersion: string;

  constructor(
    sysConfig: SysConfig,
    cts: CustomtextService
  ) {
    const ctSettings = {};
    this.app_title = 'IQB-Testcenter';
    Object.keys(customTextsDefault).forEach(k => {
      ctSettings[k] = customTextsDefault[k].defaultvalue;
      if (k === 'app_title') this.app_title = customTextsDefault[k].defaultvalue;
    });
    Object.keys(sysConfig.customTexts).forEach(k => {
      ctSettings[k] = sysConfig.customTexts[k];
      if (k === 'app_title') this.app_title = sysConfig.customTexts[k];
    });
    cts.addCustomTexts(ctSettings);
    if (sysConfig.app_title) this.app_title = sysConfig.app_title;
    this.mainLogo = sysConfig.mainLogo;
    this.background_color = sysConfig.background_color;
    this.isValidApiVersion = this.isValidVersion(sysConfig.version);
    this.detectedApiVersion = sysConfig.version;
    this.intro_html = sysConfig.intro_html;
    this.impressum_html = sysConfig.impressum_html;
    // todo: trusted_impressum_html, trusted_intro_html
    this.global_warning = sysConfig.global_warning;
    this.global_warning_expired_day = sysConfig.global_warning_expired_day;
    this.global_warning_expired_hour = sysConfig.global_warning_expired_hour;
    this.testConfig = sysConfig.testConfig;
    if (sysConfig.testConfig) {
      localStorage.setItem(localStorageTestConfigKey, JSON.stringify(sysConfig.testConfig));
    } else {
      localStorage.removeItem(localStorageTestConfigKey);
    }
    this.broadcastingService = sysConfig.broadcastingService;
  }

  private isValidVersion(reportedVersion: string): boolean {
    if (this.expectedApiVersion) {
      const searchPattern = /\d+/g;
      const expectedVersionNumbers = this.expectedApiVersion.match(searchPattern);
      if (expectedVersionNumbers) {
        if (reportedVersion) {
          const reportedVersionNumbers = reportedVersion.match(searchPattern);
          if (reportedVersionNumbers) {
            if (reportedVersionNumbers[0] !== expectedVersionNumbers[0]) {
              return false;
            }
            if (expectedVersionNumbers.length > 1) {
              if ((reportedVersionNumbers.length < 2) || +reportedVersionNumbers[1] < +expectedVersionNumbers[1]) {
                return false;
              }
              if ((expectedVersionNumbers.length > 2) && reportedVersionNumbers[1] === expectedVersionNumbers[1]) {
                if ((reportedVersionNumbers.length < 3) || +reportedVersionNumbers[2] < +expectedVersionNumbers[2]) {
                  return false;
                }
              }
            }
          } else {
            return false;
          }
        } else {
          return false;
        }
      }
    }
    return true;
  }
}
