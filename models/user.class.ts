import { findIndex, has, isEmpty, merge, remove } from 'lodash';
// import * as geofirex from 'geofirex';
import { DateTime } from 'luxon';

import { IUserBase, UserBase } from './userBase.class';
import { Base } from './base.class';
import { IUserMember, UserMember } from './userMember.class';
import { IUserFavorite } from './userFavorite.class';
import { IUserFriend } from './userFriend.class';
import { IUserActivity, UserActivity } from './userActivity.class';
import { HomeGroup, IGroup, IHomeGroup } from './group.class';
import { Meeting } from '.';

// this data never goes to !uid
export interface IUserProfile {
    anonymous: boolean;
    name: string;
    firstName: string;
    lastInitial: string;
    bday: string;
}

export class UserProfile extends Base implements IUserProfile {
    anonymous: boolean = true;
    name: string = 'Anonymous A';
    firstName: string = 'Anonymous';
    lastInitial: string = 'A';
    bday: string = '';

    // ignore provided values that don't exist on object
    // overwrite defaults with provided values

    constructor(profile?: any) {
        super();

        this.initialize(this, profile)
    }
}

export interface IUser extends IUserBase {
    email: string;
    emailVerified: boolean;
    zoomUser: boolean;
    profile: IUserProfile;
    activity: IUserActivity;
    member: IUserMember;
    homeMeeting: string;
    homeGroup: IHomeGroup;
    favGroups: IUserFavorite[];
    favMeetings: string[];
    blkMeetings: string[];
    friends: IUserFriend[];

    chatUser: any;
    created: string;

    addFavoriteMeeting(meeting: Meeting): boolean;
    removeFavoriteMeeting(meeting: Meeting): boolean;

    setUserAuthNames(displayName?: string): boolean;
    setUserNames(firstName: string, lastInitial: string): boolean;
}

declare const ONLINE_ACTIVITY = 15;
export class User extends UserBase implements IUser {
    email: string = '';
    emailVerified: boolean = false;
    zoomUser: boolean = false;
    profile: IUserProfile = <any>null;
    activity: IUserActivity = <any>null;
    member: IUserMember = <any>null;    // TODO ???
    homeMeeting: string = <any>null;
    homeGroup: IHomeGroup = <any>null;
    favGroups: IUserFavorite[] = [];
    favMeetings: any[] = [];
    blkMeetings: any[] = [];
    friends: IUserFriend[] = [];
    chatUser: any = null;
    created: string = DateTime.utc().toISO();

    public get isOnline(): boolean {
        const lastActivity: DateTime = DateTime.fromISO(this.activity.lastTime);
        return DateTime.utc().diff(lastActivity).minutes < ONLINE_ACTIVITY;
    }

    public get daysSinceBday() {
        const bday: DateTime = DateTime.fromISO(this.profile.bday);
        return DateTime.utc().diff(bday).days;
    }

    constructor(user?: any) {
        super(user);    // pass to super user?

        // This is the BaseClass (root) initialize()
        // parm1: subclass instance (this)
        // parm2: constructor parameters
        this.initialize(this, user);

        // Create Custom Object Properties
        if (has(user, 'profile') && !isEmpty(user.profile)) {
            this.profile = new UserProfile(user.profile);
        } else {
            this.profile = new UserProfile(
                merge(user, {
                    anonymous: false,
                    avatar: this.avatar
                }));

            this.setUserAuthNames(user.name);
        }
        if (has(user, 'activity') && !isEmpty(user.activity)) {
            this.activity = new UserActivity(user.activity);
        } else {
            user.activity = new UserActivity({
                id: this.id,
                name: this.profile.name,
                avatar: this.avatar,
                lastLogon: DateTime.utc().toISO(),
                lastTime: DateTime.utc().toISO(),
                point: null,
            });
        }
        if (has(user, 'member') && !isEmpty(user.member)) this.member = new UserMember(user.member);
        if (has(user, 'homeGroup') && !isEmpty(user.homeGroup)) this.homeGroup = new HomeGroup(user.homeGroup);
    }

    toObject(): IUser {
        return super.toObject(['isOnline', 'daysSinceBday'])
    }

    toGeoObject(geo?: any): IUser {
        const activity = this.activity;
        const obj = super.toGeoObject(geo);
        obj.activity = activity.toGeoObject(geo);
        return obj;
    }

    public get isHomeMeeting(): boolean {
        return this.id === this.homeMeeting;
    }

    // public get isHomeGroup(): boolean {
    //     return this.id === get(this, 'homeGroup.id', false);
    // }

    // public isFavorite(group: IGroup): boolean {
    //     const rv = -1 !== findIndex( this.favGroups, (fg => {
    //         return (fg.gid === group.id) // TODO add schedule logic && (!has(fg, 'sid') || fg.sid === data.sid)
    //     }))

    //     return rv;
    // }

    public isFavoriteMeeting(meeting: Meeting): boolean {
        const rv = -1 !== findIndex(this.favMeetings, (id => {
            return (id === meeting.id);
        }))
        return rv;
    }

    public addFavoriteMeeting(meeting: Meeting): boolean {
        if (!this.isFavoriteMeeting(meeting)) {
            this.favMeetings.push(meeting.id);
        }
        return true;
    }

    public removeFavoriteMeeting(meeting: Meeting): boolean {
        if (this.isFavoriteMeeting(meeting)) {
            remove(this.favMeetings, (value: any, index: number, array: any) => {
                return value === meeting.id;
            });
        }
        return true;
    }

    public setUserAuthNames(name?: string): boolean {
        const random_li = ''; // 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)];
        const names = <string []>name?.split(' ');
        this.profile.firstName = names[0];
        this.profile.lastInitial = (names.length === 1) ? random_li
            : (names[1].length > 0) ? names[1].substr(0, 1).toUpperCase() : random_li;
        return this.setUserNames(this.profile.firstName, this.profile.lastInitial);
    }

    public setUserNames(firstName: string, lastInitial: string): boolean {
        if (!firstName
            || !lastInitial
            || firstName.length > 25
            || lastInitial.length > 25) {
            return false;
        }
        this.profile.firstName = firstName;
        this.profile.lastInitial = lastInitial;
        this.profile.name = `${firstName} ${lastInitial}` + (lastInitial.length === 1 ? '.' : '');
        this.name = this.profile.name;
        return true;
    }

    public setHomeGroup(group: IGroup) {
        this.homeGroup = new HomeGroup(group);
    }

    public removeHomeGroup() {
        this.homeGroup = <any>null;
    }
}

