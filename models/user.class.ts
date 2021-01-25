import * as _ from 'lodash';
import * as geofirex from 'geofirex';
import { DateTime } from 'luxon';

import { UserBase } from './userBase.class';
import { Base } from './base.class';
import { IUserMember, UserMember } from './userMember.class';
import { IUserFavorite } from './userFavorite.class';
import { IUserFriend } from './userFriend.class';
import { IUserActivity, UserActivity } from './userActivity.class';
import { HomeGroup, IGroup, IHomeGroup } from './group.class';
import { IMeeting } from '../listings';

// this data never goes to !uid
export interface IUserProfile {
    anonymous: boolean;
    firstName: string;
    lastInitial: string;
    bday: string;
}

export class UserProfile extends Base implements IUserProfile {
    anonymous: boolean = true;
    firstName: string = 'Anonymous';
    lastInitial: string = 'A';
    bday: string = '';

    // ignore provided values that don't exist on object
    // overwrite defaults with provided values

    constructor(user?: any) {
        super();

        this.initialize(this, user)
    }
}

export interface IUser {
    id: string;             // Id
    name: string;           // UserBase
    profile: IUserProfile;
    activity: IUserActivity;
    member: IUserMember;
    homeMeeting: IMeeting;
    homeGroup: IHomeGroup;
    favGroups: IUserFavorite[];
    favMeetings: string[];
    blkMeetings: string[];
    friends: IUserFriend[];
    
    chatUser: any;
    created: string;
}

declare const ONLINE_ACTIVITY = 15;
export class User extends UserBase implements IUser {
    profile: IUserProfile       = <any>null;
    activity: IUserActivity     = <any>null;
    member: IUserMember         = <any>null;    // TODO ???
    homeMeeting: IMeeting       = <any>null;
    homeGroup: IHomeGroup       = <any>null;
    favGroups: IUserFavorite[]  = [];
    favMeetings: any[]          = [];
    blkMeetings: any[]          = [];
    friends: IUserFriend[]      = [];
    chatUser: any               = null;
    created: string             = DateTime.utc().toISO();

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
        if (_.has(user, 'profile') && !_.isEmpty(user.profile)) this.profile = new UserProfile(user.profile);
        if (_.has(user, 'activity') && !_.isEmpty(user.activity)) this.activity = new UserActivity(user.activity);
        if (_.has(user, 'member') && !_.isEmpty(user.member)) this.member = new UserMember(user.member);
        if (_.has(user, 'homeGroup') && !_.isEmpty(user.homeGroup)) this.homeGroup = new HomeGroup(user.homeGroup);
    }

    toGeoObject(geo?: geofirex.GeoFireClient): IUser {
        const activity = this.activity;
        const obj = super.toGeoObject(geo);
        obj.activity = activity.toGeoObject(geo);
        return obj;
    }

    public isHomeGroup(group: IGroup): boolean {
        return group.id === _.get(this, 'homeGroup.id', false);
    }

    public isFavorite(group: IGroup): boolean {
        const rv = -1 !== _.findIndex( this.favGroups, (fg => {
            return (fg.gid === group.id) // TODO add schedule logic && (!_.has(fg, 'sid') || fg.sid === data.sid)
        }))

        return rv;
    }

    public setUserAuthNames(displayName?: string): boolean {
        if (this.profile.anonymous
            // || TODO displayName is all whitespace
            || displayName === undefined
            || displayName === null
            || !displayName.includes(' ')
            || displayName.length < 3
            || displayName.split(' ').length < 2) {
            this.profile.firstName = 'Anonymous';
            this.profile.lastInitial = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)];
        } else {
            const names = displayName.split(' ');
            this.profile.firstName = names[0];
            this.profile.lastInitial = names[1][0].toUpperCase();
        }
        this.name = `${this.profile.firstName} ${this.profile.lastInitial}.`;
        return true;
    }

    public setUserNames(firstName: string, lastInitial: string): boolean {
        if (!firstName
            || !lastInitial
            || firstName.length > 25
            || lastInitial.length !== 1) {
            return false;
        }
        this.profile.firstName = firstName;
        this.profile.lastInitial = lastInitial;
        this.name = `${firstName} ${lastInitial}.`;
        return true;
    }

    public setHomeGroup(group: IGroup) {
        this.homeGroup = new HomeGroup(group);
    }

    public removeHomeGroup() {
        this.homeGroup = <any>null;
    }
}

