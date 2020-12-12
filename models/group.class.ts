import { FirePoint } from "geofirex";
import { DateTime } from 'luxon';

import { Base, IBase } from './base.class';
import { Id } from "./id.class";
import { IAddress, IGroup, ILocation, ISchedule, IBoundingBox, IGroupPrivate, IUserMember, IHomeGroup, GroupBLL, IUserBadge } from ".";


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
        return GroupBLL.tagsString(this);
    }

    public get memberCount(): number {
        return GroupBLL.memberCount(this);
    }

    public get yearsSobriety(): number {
        return GroupBLL.yearsSobriety(this);
    }

    public get membersOnline(): number {
        return GroupBLL.membersOnline(this);
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