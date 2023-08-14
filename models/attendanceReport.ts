import { DateTime } from 'luxon';
import { Base, IBase } from '../models/base.class';
import { Id, IId } from '../models/id.class';
export interface IAttendanceReport extends IId {
    uid: string;
    timezone: string;       // tz of user at time of attendance
    created: number;        // server utc millis created
    created$: string;

    attendances: string[];

    email: string; // recipient
    html: string;
    messageId: string;
    data: any;
}

export class AttendanceReport extends Id implements IAttendanceReport {
    uid: string = '';
    timezone: string = DateTime.now().zoneName as string;
    created: number = DateTime.now().toMillis();
    created$: string = '';

    attendances: string[] = [];

    email: string = <any>null;
    html: string = '<html></html>';
    messageId: string = '';
    data: any = null;

    constructor(device?: any) {
        super();
        this.initialize(this, device);

        this.created$ = DateTime.fromMillis(this.created).setZone(this.timezone).toFormat('FFF');
    }
}