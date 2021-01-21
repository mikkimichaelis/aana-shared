import * as _ from 'lodash';
import { Date } from 'moment'

import { Id, IId } from "../models/id.class";
import { Schedule, ISchedule } from '../models/schedule.class';
import { IRecurrence, Recurrence } from './recurrence';

export interface IMeeting extends IId {
    zid: string;
    uid: string;
    isZoomOwner: boolean;
    name: string;
    password: string;
    topic: string;
    continuous: boolean;

    timezone: string;
    startTime: string;
    duration: number;

    recurrence: IRecurrence;
    schedule: ISchedule;
}

export interface IZoomMeeting extends IMeeting {
    zid: string;
    zUsersAttend: string[]; // Zoom users in attendance
}

export class Meeting extends Id implements IMeeting {
    zid: string                 = '';
    uid: string                 = '';
    active: boolean             = true;
    // private
    isZoomOwner: boolean        = false;
    name: string                = '';
    password: string            = '';
    topic: string               = '';
    continuous: boolean         = false;

    timezone: string            = "-5";
    startTime: string           = "00:00";
    duration: number            = 60;
    utc: string                 = '';   // ISO UTC 0

    time: number                = 0;    // Millisecond UTC 0 time offset of 1/2/1970 + timezone + startTime

    // tags

    recurrence: IRecurrence     = new Recurrence()
    schedule: ISchedule         = new Schedule();

    constructor(meeting?: IMeeting) {
        super(meeting);
        this.initialize(this, meeting);
    }

    updateDayTime() {
        if (this.recurrence.type == 1) {
            this.recurrence.weekly_days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        }

        this.time = Date.parse('01/01/1970 ' + this.time + ' UTC');
    }
}