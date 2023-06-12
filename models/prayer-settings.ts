import { SettingsBase } from './settings-base.js';

export interface IPrayerSettings {
    group: string,
    random: boolean,
    prayer: string,
    reminders: boolean,
    morning: number | null,
    noon: number | null,
    night: number | null
}

export class PrayerSettings extends SettingsBase implements IPrayerSettings {
    group: string = 'NA';
    random: boolean = true;
    prayer: string = '';
    reminders: boolean = false;
    morning: number | null = null;
    noon: number | null = null;
    night: number | null = null;

    version = 0;
    constructor(settings?: IPrayerSettings) {
        super();
        this.update(settings, this.version);
    }
}