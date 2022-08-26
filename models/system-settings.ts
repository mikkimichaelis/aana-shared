import { SettingsBase } from './settings-base';

export interface ISystemSettings {
    version: number,

    app_version: string,
    first_run: boolean;

    last_run: number;           // ts of last time app was last run
    last_tick: number;          // ts of last run tick used to determine how long app was used last run

    // TODO DEPRICATED
    show_slides: boolean,
    show_help: boolean,
    show_web_req: boolean,

    show_use_zoom_req: boolean
}

export class SystemSettings extends SettingsBase implements ISystemSettings {
    // Default Values
    version = 5;                // This is the version of these settings
    app_version = <any>null;    // set app_version value of this build in SettingsService 
                                // can't import version.js here, we are a shared lib
    first_run = true;

    last_run = 0;
    last_tick = 0;

    show_slides = true;
    show_help = true;
    show_web_req = true;

    show_use_zoom_req = true;

    constructor(settings?: ISystemSettings) {
        super();
        this.update(settings, this.version);
    }
}