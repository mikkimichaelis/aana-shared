import { cloneDeep, concat, isEmpty, isNil, join, split } from 'lodash';
import { DateTime } from 'luxon';
import { User } from '../models/user.class';
import { Id, IId } from '../models/id.class';


export interface IAttendance extends IId {
    uid: string;    // User ID
    mid: string;    // Meeting.id
    zid: string;    // Zoom ID

    records: IAttendanceRecord[];

    signature: string;
}

export class Attendance extends Id {
    uid: string = '';
    mid: string;
    zid: string = '';

    records: IAttendanceRecord[] = [];

    ip: string;
    iip: number[];

    signature: string;

    constructor(attendance) {
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
    volume: number;
    audio: boolean;
    muted: boolean;
    loud: boolean;
    timestamp: string;
    created: string = DateTime.utc().toISO();
   
    constructor(attendance?: any) {
        super(attendance);
        this.initialize(this, attendance);
    }
}