import { DateTime } from 'luxon';
import { Base, IBase } from '../models/base.class';
import { Id, IId } from '../models/id.class';
export interface IAttendanceReport extends IId {
    uid: string;
    version: number;
    timezone: string;       // tz of user at time of attendance
    created: number;        // server utc millis created
    created$: string;
    updated: number;

    aids: string[];         // attendance.id[]

    email: string; // recipient
    html: string;
    messageId: string;
    data: any;

    date: string;
    end: string;
    start: string;
    total: string;
    total_credit: number;
    total_meetings: string;
    unsubscribe: string;
    user_email: string;
    user_name: string;
}

export class AttendanceReport extends Id implements IAttendanceReport {
    uid: string = '';
    version: number = 1;
    timezone: string = DateTime.now().zoneName as string;
    created: number = DateTime.now().toMillis();
    created$: string = '';
    updated: number = DateTime.now().toMillis();

    aids: string[] = [];

    email: string = <any>null;
    html: string = '<html></html>';
    messageId: string = '';
    data: any = null;

    date: string = ''
    end: string = '';
    start: string = '';
    total: string = '';
    total_credit: number = 0;
    total_meetings: string = '';
    unsubscribe: string = '';
    user_email: string = '';
    user_name: string = '';

    constructor(device?: any) {
        super();
        this.initialize(this, device);

        this.created$ = DateTime.fromMillis(this.created).setZone(this.timezone).toFormat('FFF');
    }
}