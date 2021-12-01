import { SettingsBase } from './settings-base';
export interface IUserSettings {
    version: number;
    darkTheme: boolean;
    useZoomApp: boolean;
    disableUserVideo: boolean;
    disableUserAudio: boolean;
    disableUserName: boolean;
}

export class UserSettings extends SettingsBase implements IUserSettings {
    // Default Values
    version = 3;
    darkTheme = true;
    useZoomApp = false;
    disableUserVideo = true;
    disableUserAudio = true;
    disableUserName = false;

    constructor(settings?: IUserSettings) {
        super();
        this.update(settings, this.version);
    }
}