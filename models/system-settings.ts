import { DateTime } from 'luxon';
import { SettingsBase } from './settings-base';

export interface ISystemSettings {
    version: number,

    app_version: string;
    first_run: boolean;
    first_use_journal: string;

    intro_tutorial: string;     // null: complete, otherwise string at which to start
    journal_tutorial: string;   // same...
    editor_tutorial: string;    // same...

    last_run: number;           // ts of last time app was last run
    last_tick: number;          // ts of last run tick used to determine how long app was used last run

    // last_run: number;        // ts of last time app was last run
    // last_tick: number;       // ts of last run tick used to determine how long app was used last run

    show_web_req: boolean,
    show_use_zoom_req: boolean

    total_runs: number
}

export class SystemSettings extends SettingsBase implements ISystemSettings {
    version = 5;                // version of these settings
    app_version = <any>null;    // set to null to flag a new app install
                                // app_version is then set in update.service
    first_run = true;

    // ISO of first day journal free period
    first_use_journal: string = DateTime.now().toISO();

    intro_tutorial = 'welcome';
    journal_tutorial = 'start';
    editor_tutorial = 'start';

    last_run = 0;
    last_tick = 0;

    show_web_req = true;
    show_use_zoom_req = true;

    total_runs = 0;

    constructor(settings?: ISystemSettings) {
        super();
        this.update(settings, this.version);
    }
}