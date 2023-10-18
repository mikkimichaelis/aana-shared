import { SettingsBase } from './settings-base';
export interface IUserSettings {
    version: number;
    theme: string;
    darkTheme: boolean;
    useZoomApp: boolean;
    liveSearchLanguage: boolean;
    liveSearchType: boolean;
    showTimerPage: boolean;
    showContinuousMeetings: boolean;
    meetingVerification: boolean;
}

export class UserSettings extends SettingsBase implements IUserSettings {
    // Default Values
    version = 8;
    theme = 'dark-theme blue';
    darkTheme = true;
    useZoomApp = true;
    liveSearchLanguage = false;
    liveSearchType = false;
    showTimerPage = true;
    showContinuousMeetings = true;
    meetingVerification = true;

    constructor(settings?: IUserSettings) {
        super();
        this.update(settings, this.version);
    }
}