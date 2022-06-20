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
    version = 5;
    theme = 'dark-pink-toes';
    darkTheme = true;
    useZoomApp = false;
    liveSearchLanguage = false;
    liveSearchType = false;

    constructor(settings?: IUserSettings) {
        super();
        this.update(settings, this.version);
    }
}