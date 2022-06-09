import { DateTime } from 'luxon';
import { Base, IBase } from '../models/base.class';
import { Id, IId } from '../models/id.class';
export interface IAttendanceReport extends IId {
    arid: string;
    timezone: string;       // tz of user at time of attendance
    created: number;        // server utc millis created
    created$: string;

    attendances: string[];
    html: string;
    messageId: string;
    data: any;
}

export class AttendanceReport extends Id implements IAttendanceReport {
    arid: string = '';
    timezone: string = DateTime.now().zoneName;
    created: number = DateTime.now().toMillis();
    created$: string = '';

    attendances: string[] = [];
    html: string = '<html></html>';
    messageId: string = '';
    data: any = null;

    constructor(device?: any) {
        super();
        this.initialize(this, device);

        this.created$ = DateTime.fromMillis(this.created).setZone(this.timezone).toFormat('FFF');
    }
}