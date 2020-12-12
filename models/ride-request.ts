import { FirePoint } from 'geofirex';

export interface IRideRequest {
    gid: string;    // group id
    sid: string;    // schedule id
    mid: string;    // meeting id
    ruid: string;   // requesting user id
    puid: string;   // providing user id
    date: string;
    phone: string;
    point: FirePoint;
    providedDate: string;
}