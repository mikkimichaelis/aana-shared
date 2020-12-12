import { FirePoint } from 'geofirex';
import { ILocation, ISchedule, IBoundingBox, IAddress, IUserMember, IUserBadge } from '.';
import { IBase } from './base.class';

export interface IGroupPrivate extends IBase {
    gid: string;
    owner: IUserBadge;
    admins: IUserBadge[];
}

export interface IHomeGroup {
    gid: string;
    name: string;
    dateJoined: string;
}

export interface IGroup {
    id: string;
    sourceUrl: string;
    
    name: string;
    type: string;
    active: boolean;

    region: string;

    tags: string[];
    about: string;
    point: FirePoint;

    schedules: ISchedule[];

    notes: string;

    telephone: string;
    email: string;
    url: string;

    address: IAddress;

    started: string;

    location: ILocation;
    zoneIANA: string;

    boundingbox: IBoundingBox;

    members: IUserMember[];

    lastActivity: string;

    tagsString: string;
    memberCount: number;
    yearsSobriety: number;
    membersOnline: number;
}