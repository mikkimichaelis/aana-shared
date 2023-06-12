import { SettingsBase } from './settings-base.js';
export interface ITimerSettings {
    startMillis: number | null;
    meetingId: string | null;
}

export class TimerSettings extends SettingsBase implements ITimerSettings {
    public startMillis: number | null = null;
    public meetingId: string | null = null;

    version = 0;
    constructor(settings?: ITimerSettings) {
        super();
        this.update(settings, this.version);
    }
}