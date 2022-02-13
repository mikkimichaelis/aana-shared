import { LargeNumberLike } from 'crypto';
import { SettingsBase } from './settings-base';
export interface IUserSettings {
    version: number;
    theme: string;
    darkTheme: boolean;
    useZoomApp: boolean;
    liveSearchLanguage: boolean;
    liveSearchType: boolean;
}

export class UserSettings extends SettingsBase implements IUserSettings {
    // Default Values
    version = 4;
    theme = 'dark-myka-marie';
    darkTheme = true;
    useZoomApp = false;
    liveSearchLanguage = false;
    liveSearchType = false;

    constructor(settings?: IUserSettings) {
        super();
        this.update(settings, this.version);
    }
}

export interface IUserStats {
    last_meeting_date: number;      // updated by joinMeeting()
    app_runs_total: number;         // updated every time the app starts +1
    app_runs_today: number;         // updated ever app start, reset to 0 by nightly process to use in calculating running averages
    app_runs_avg_7: number;
    app_runs_avg_14: number;
    app_runs_avg_28: number;
    app_runs_avg_2m: number;
    app_runs_avg_4m: number;
    app_runs_avg_6m: number;

    meeting_count_total: number;     // updated by joinMeetings()
    meeting_count_today: number;     // updated by joinMeetings(), reset to 0 by nightly process to use in calculating running averages
    meeting_count_avg_7: number,     // 7 day running average meetings per day
    meeting_count_avg_14: number,    // 14 day
    meeting_count_avg_28: number,    // 27 day
    meeting_count_avg_2m: number,    // 2 month
    meeting_count_avg_4m: number,    // 4 month
    meeting_count_avg_6m: number,    // 6 month running average meetings per day

}