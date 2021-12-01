import { SettingsBase } from './settings-base';

export interface ISystemSettings {
    version: number,
    app_version: string,
    first_run: boolean;
    show_slides: boolean,
    show_help: boolean,
    show_web_req: boolean,
}

export class SystemSettings extends SettingsBase implements ISystemSettings {
    // Default Values
    version = 0;                // This is the version of these settings
    app_version = null;         // set app_version value of this build in SettingsService 
                                // can't import version.js here, we are a shared lib
    first_run = true;
    show_slides = true;
    show_help = true;
    show_web_req = true;

    constructor(settings?: ISystemSettings) {
        super();
        this.update(settings, this.version);
    }
}