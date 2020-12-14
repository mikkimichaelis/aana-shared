import { FirePoint } from "geofirex";
import * as _ from "lodash";
import { DateTime } from 'luxon';
import { IAddress } from "./address";

import { Base, IBase } from './base.class';
import { IBoundingBox } from "./bounding-box";
import { Id } from "./id.class";
import { ILocation } from "./location";
import { ISchedule } from "./schedule.interface";
import { IUser, User } from "./user.class";
import { IUserBadge } from "./userBadge.class";
import { IUserMember, UserMember } from "./userMember.class";

export interface IGroupPrivate extends IBase {
  id: string;
  owner: IUserBadge;
  admins: IUserBadge[];
}

export class GroupPrivate extends Base implements IGroupPrivate {
  id: string = '';
  owner!: IUserBadge;
  admins: IUserBadge[] = [];
}

export interface IHomeGroup {
  id: string;
  name: string;
  dateJoined: string;
}

export class HomeGroup extends Base implements IHomeGroup {
  id: string = '';
  name: string = '';
  dateJoined: string = DateTime.local().toISO();

  constructor(group: any) {
    super();
    this.initialize(this, group);
    this.id = group.id;
  }
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
  started: string;
  notes: string;
  telephone: string;
  email: string;
  url: string;
  address: IAddress;
  location: ILocation;
  zoneIANA: string;

  point: FirePoint;
  boundingbox: IBoundingBox;

  members: IUserMember[];
  schedules: ISchedule[];

  lastActivity: string;
}

export class Group extends Id implements IGroup {
  sourceUrl: string = '';
  name: string = '';
  type: string = '';
  active: boolean = true;
  region: string = '';
  tags: string[] = [];
  about: string = '';
  started: string = '';
  notes: string = '';
  telephone: string = '';
  email: string = '';
  url: string = '';
  address!: IAddress;
  location!: ILocation;
  zoneIANA: string = '';

  point!: FirePoint;
  boundingbox!: IBoundingBox;

  members: IUserMember[] = [];
  schedules: ISchedule[] = [];

  lastActivity: string = DateTime.local().toISO();

  public get tagsString(): string {
    if (Array.isArray(this.tags)) {
      return this.tags.join(' ');
    } else {
      return '';
    }
  }

  public get memberCount(): number {
    if (Array.isArray(this.members)) {
      return this.members.length;
    } else {
      return 0;
    }
  }

  public get yearsSobriety(): number {
    if (Array.isArray(this.members)) {
      // TODO check algorithm
      return _.sum(_.map(this.members, (member: IUserMember) => {
        return member.daysSinceBday;
      })) / 365;
    } else {
      return 0;
    }
  }

  public get membersOnline(): number {
    if (Array.isArray(this.members)) {
      // TODO check algorithm
      return _.sum(_.map(this.members, (member: IUserMember) => {
        return member.isOnline ? 1 : 0;
      })) / 365;
    } else {
      return 0;
    }
  }

  constructor(group?: any) {
    super(group)
    this.initialize(this, group);
  }

  isHomeGroup(iuser: User): boolean {
    return iuser.isHomeGroup(this);
  }


  public orderSchedules(): ISchedule[] {
    // let week = 7 * 24 * 60 * 1000;  // 1 week in ms
    let now: any = DateTime.local();
    now = DateTime.fromObject({ year: 1970, month: 1, day: now.weekday, hour: now.hour, minute: now.min, second: now.second });
    now = now.toMillis();
    const rv: ISchedule[] = [];
    try {
      this.schedules.forEach(s => {
        const x = this.getNextSchedule(now);
        if (!x) throw new Error();  // exit forEach
        rv.push(x);
        now = x.millis + 1;
      });
    } catch { }
    return rv;
  }

  public getNextSchedule(now: number): ISchedule | null {
    let rv: ISchedule | null = null;
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

  public addMember(user: IUser) {
    // TODO error check not duplicate add
    if (!this.members) this.members = [];
    const userMember = new UserMember(user);
    const iuserMember = userMember.toObject();
    this.members.push(iuserMember);
  }

  public removeMember(user: IUser) {
    _.remove(this.members, (value:any, index:number, array:any) => {
      return value.id === user.id;
    })
  }

  public isMember(user: IUser) {
    return this.members.findIndex(m => {
      return m.id === user.id;
    });
  }

  toObject() {
    return super.toObject(['schedules']);
  }
}