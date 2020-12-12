
import * as _ from 'lodash';
import { Id } from "./id.class";
import { ISchedule } from '.';

export class Schedule extends Id implements ISchedule {
    gid!: string;
    zoom!: boolean;
    day!: string;
    time!: string;
    duration!: number;
    recurring!: boolean;
    active!: boolean;
    notes!: string;
    millis!: number;
    lastUpdate!: string;

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

        if ( this.millis === 0 ) {
            const dow = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].indexOf(this.day) + 1;
            this.millis = (Date.parse('01/' + dow.toString() + '/1970 ' + this.time + ' UTC'))
        }
    }
}