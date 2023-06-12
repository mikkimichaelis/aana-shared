import { SettingsBase } from './settings-base.js';
export interface IUserSettings {
    version: number;
    theme: string;
    darkTheme: boolean;
    useZoomApp: boolean;
    liveSearchLanguage: boolean;
    liveSearchType: boolean;
    showTimerPage: boolean;
}

export class UserSettings extends SettingsBase implements IUserSettings {
    // Default Values
    version = 7;
    theme = 'dark-theme pink-toes';
    darkTheme = true;
    useZoomApp = true;
    liveSearchLanguage = false;
    liveSearchType = false;
    showTimerPage = true;

    constructor(settings?: IUserSettings) {
        super();
        this.update(settings, this.version);
    }
}