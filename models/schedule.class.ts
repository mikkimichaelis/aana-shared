
import * as _ from 'lodash';
import { Id } from "./id.class";
import { ISchedule } from '.';
import { DateTime } from 'luxon';

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