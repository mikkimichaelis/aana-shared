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
import { IUser } from "./user.class";
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
                return member.isOnline ? 1 : 0;
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

    isHomeGroup(iuser: IUser): boolean {
      return this.id === (_.has(iuser, 'homeGroup.gid') ? iuser.homeGroup.gid : false);
    }


    public orderSchedules(): ISchedule[] {
        let week = 7 * 24 * 60 * 1000;  // 1 week in ms
        let now: any = DateTime.local();
        now = DateTime.fromObject({ year: 1970, month: 1, day: now.weekday, hour: now.hour, minute: now.min, second: now.second });
        now = now.toMillis();
        let rv: ISchedule[] = [];
        this.schedules.forEach(s => {
          const x = this.getNextSchedule(now);
          rv.push(x);
          now = x.millis + 1;
        });
        return rv;
      }
    
      public getNextSchedule(now: number): ISchedule {
        let rv: ISchedule;
        this.schedules.forEach(schedule => {
          // ignore if not active
          if (schedule.active) {
            if (!rv) {  // special handle if no schedule yet
              if (schedule.millis < now) {
                // s happens next week if recurring otherwise ignore
                rv = schedule.recurring ? schedule : null;
              } else {
                // s happens this week
                rv = schedule;
              }
            } else if (schedule.millis > now) {
              // s happens this week
              rv = schedule.millis < rv.millis ? schedule : rv; // s comes before schedule
            } else if (schedule.recurring) {
              // s happens next week
              if (rv.millis < now) { // schedule also happens next week
                rv = schedule.millis < rv.millis ? schedule : rv; // s comes before schedule next week
              } else {
                // schedule happens this week so keep it
                // schedule = schedule;
              }
            }
          }
        });
        return rv;
      }

    toObject() {
        return super.toObject(['schedules']);
    }
}