import { DateTime } from 'luxon';
import { Id, IId } from '../models/id.class';


export interface IAttendance extends IId {
    uid: string;    // User ID
    mid: string;    // Meeting.id
    zid: string;    // Zoom ID
    pid: string;    // Zoom meeting participation(?) id

    records: IAttendanceRecord[];

    signature: string;
}

export class Attendance extends Id implements IAttendance {
    uid: string = '';
    mid: string = '';
    zid: string = '';
    pid: string = '';

    records: IAttendanceRecord[] = [];

    ip: string = '';
    iip: number[] = [];

    signature: string = ''

    constructor(attendance: any) {
        super(attendance);
        this.initialize(this, attendance);
    }
}

export interface IAttendanceRecord extends IId {
    status: string;
    verified: boolean;
    verified_method: string;
    visible: boolean;
    volume: number;
    audio: boolean;
    muted: boolean;
    loud: boolean;
    timestamp: string;
    created: string;

    ipv4: string;
    iipv4: number[];
    ipv6: string;
    iipv6: string[];

    signature: string;
}

export class AttendanceRecord extends Id {

    uid: string = '';
    zid: string = '';
    did: string = '';

    status: string = '';
    verified: boolean = false; 
    visible: boolean = false;
    volume: number = 0;
    audio: boolean = false;
    muted: boolean = true;
    loud: boolean = false;
    timestamp: string = '';
    created: string = DateTime.utc().toISO();
   
    constructor(attendance?: any) {
        super(attendance);
        this.initialize(this, attendance);
    }
}