import { FirePoint } from "geofirex";
import _ from "lodash";
import { DateTime } from 'luxon';
import { IAddress } from "./address";

import { Base, IBase } from './base.class';
import { IBoundingBox } from "./bounding-box";
import { IGroup, IGroupPrivate, IHomeGroup } from "./group.interface";
import { Id } from "./id.class";
import { ILocation } from "./location";
import { ISchedule } from "./schedule.interface";
import { IUserBadge } from "./userBadge.class";
import { IUserMember, UserMember } from "./userMember.class";
//import { IAddress, IGroup, ILocation, ISchedule, IBoundingBox, IGroupPrivate, IUserMember, IHomeGroup, GroupBLL, IUserBadge } from ".";


export class GroupPrivate extends Base implements IGroupPrivate {
    gid!: string;
    owner!: IUserBadge;
    admins!: IUserBadge[];
}

export class HomeGroup extends Base implements IHomeGroup, IBase {
    gid!: string;
    name!: string;
    dateJoined!: string;

    constructor(group: any)  {
        super({});
        this.gid = group.id;
        this.name = group.name;
        this.dateJoined = DateTime.local().toISO()
    }
    
}

export class Group extends Id implements IGroup {
    sourceUrl!: string;
    name!: string;
    type!: string;
    active!: true;
    region!: string;
    tags!: string[];
    about!: string;
    notes!: string;
    telephone!: string;
    email!: string;
    url!: string;
    started!: string;   
    zoneIANA!: string;
    
    boundingbox!: IBoundingBox;
    point!: FirePoint;
    address!: IAddress;
    location!: ILocation;
    schedules!: ISchedule[];
    members!: IUserMember[];
    
    lastActivity!: string;

    public get tagsString(): string {
        if( Array.isArray(this.tags) ) {
            return this.tags.join(' ');
        } else {
            return '';
        }
    }

    public get memberCount(): number {
        if( Array.isArray(this.members) ) {
            return this.members.length;
        } else {
            return 0;
        }
    }

    public get yearsSobriety(): number {
        if( Array.isArray(this.members) ) {
            // TODO check algorithm
            return _.sum(_.map(this.members, (member:IUserMember) => {
                return member.daysSinceBday;
            })) / 365;
        } else {
            return 0;
        }
    }

    public get membersOnline(): number {
        if( Array.isArray(this.members) ) {
            // TODO check algorithm
            return _.sum(_.map(this.members, (member:IUserMember) => {
                return this.isOnline(member.lastActivity) ? 1 : 0;
            })) / 365;
        } else {
            return 0;
        }
    }
 
    constructor(group?: any) {
        super(group)
        // super(_.merge({
        //     sourceUrl: '',
        //     name: '',
        //     type: '',
        //     active: true,
        //     region: '',
        //     tags: [],
        //     about: '',
        //     point: null,
        //     notes: '',
        //     telephone: '',
        //     email: '',
        //     url: '',
        //     address: {},
        //     started: '',
        //     location: {},
        //     zoneIANA: 0,
        //     boundingbox: {},
        //     members: [],
        //     lastActivity: '',
        // }, group))
    }
    toObject() {
        return super.toObject(['schedules']);
    }
}