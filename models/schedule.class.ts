
import * as _ from 'lodash';
import { Id } from "./id.class";
import { DateTime } from 'luxon';

export interface IZoomSchedule extends ISchedule {
    aid: string;    // user id of Zoom account admin
    zid: string;
    zpw: string;
}

export interface ISchedule {
    id: string;
    gid: string;
    zoom: boolean;
    day: string;        // UI string representing dow when group occurs ie Monday
    time: string;       // UI string representing time when group occurs ie 7:00 pm
    millis: number;     // Millisecond time offset of date/time from from 1/1/1970 +0
    // offset includes dow + time in ms
    // NOTE: Timezone and UTC offset are irrelevant because the phones time will 
    // be in the same tz/utc offset as the group.  Therefore they can be ignored
    // and a comparison be performed simply on 12h a/p format, just like a humans do.
    // IE. when checking if I've arrived at a group on time and the group starts at
    // 7pm and my phone says 6:50pm, I don't check the groups tz offset, check if Daylight Savings
    // is in effect, or if I'm accidentally in the wrong timezone.  Technically my phones TZ can be
    // wrong, and that would cause problems, but thats a user error for which I'll not write code to handle.
    // I'll assume if a person is standing at a group their phone is in the same tz as the group itself.
    duration: number;   // minute duration of group
    recurring: boolean;
    lastUpdate: string;
    notes: string;
    active: boolean;
};


export class Schedule extends Id implements ISchedule {
    gid: string = '';
    zoom: boolean = false;
    day: string = '';
    time: string = '';
    duration: number = 60;
    recurring: boolean = true; // TODO verify used in scheduling algorithms
    active: boolean = true;
    notes: string = '';
    millis: number = 0;
    lastUpdate: string = DateTime.utc().toISO();

    constructor(schedule?: any) {
        super(_.merge({
            gid: '',
            zoom: false,
            day: '',
            time: '',
            duration: 0,
            recurring: true,
            active: true,
            notes: '',
            millis: 0,
        }, schedule));

        if (this.millis === 0) {
            // TODO i18n this
            const dow = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].indexOf(this.day) + 1;
            this.millis = (Date.parse('01/' + dow.toString() + '/1970 ' + this.time + ' UTC'))
        }
    }
}