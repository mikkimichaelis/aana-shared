import { SettingsBase } from './settings-base';
export interface IReportSettings {
    email: string;
    cc: boolean;
}

export class ReportSettings extends SettingsBase implements IReportSettings {
    version = 1;
    // Default Values
    email: string = '';
    cc: boolean = false;

    constructor(settings?: IReportSettings) {
        super();
        this.update(settings, this.version);
    }
}