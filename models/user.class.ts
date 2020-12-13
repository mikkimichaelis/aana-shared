import * as _ from 'lodash';
import { DateTime } from 'luxon';
import { FirePoint } from 'geofirex';

import { UserBase } from './userBase.class';
import { Base } from './base.class';
import { IUserMember, UserMember } from './userMember.class';
import { IGroup, IHomeGroup } from './group.interface';
import { IUserFavorite } from './userFavorite.class';
import { IUserFriend } from './userFriend.class';
import { IUserActivity } from './userActivity.class';
import { HomeGroup } from './group.class';

export interface IUserPosition {
    point: FirePoint;
}

export class UserPosition {
    point!: FirePoint;
}

// this data never goes to !uid
export interface IUserProfile {
    anonymous: boolean;
    firstName: string;
    lastInitial: string;
    name: string;
    bday: string;
}

export class UserProfile extends Base implements IUserProfile {
    anonymous!: boolean;
    firstName!: string;
    lastInitial!: string;
    name!: string;
    bday!: string;

    // ignore provided values that don't exist on object
    // overwrite defaults with provided values

    constructor(profile?: any) {
        super();

        this.initialize(this, profile, {
            anonymous: true,
            firstName: 'Anonymous',
            lastInitial: '',
            name: 'Anonymous',
            bday: '',
        })
    }
}

export interface IUser {
    profile: IUserProfile;
    member: IUserMember;
    homeGroup: IHomeGroup;
    activity: IUserActivity;
    favGroups: IUserFavorite[];
    friends: IUserFriend[];
    created: string;
}

declare const ONLINE_ACTIVITY = 15;
export class User extends UserBase implements IUser {
    profile!: IUserProfile;
    member!: IUserMember;
    homeGroup!: IHomeGroup;
    activity!: IUserActivity;
    favGroups!: IUserFavorite[];
    friends!: IUserFriend[];
    created!: string;

    public get isOnline(): boolean {
        const lastActivity: DateTime = DateTime.fromISO(this.activity.lastTime).toLocal();
        return DateTime.local().diff(lastActivity).minutes < ONLINE_ACTIVITY;
    }

    public get daysSinceBday() {
        const bday: DateTime = DateTime.fromISO(this.profile.bday);
        return DateTime.local().toUTC().diff(bday).days;
    }

    constructor(user?: any) {
        super()
        
        _.merge({
            created: DateTime.local().toISO(),
            profile: new UserProfile(),
            member: {},
            homeGroup: {},
            favGroups: [],
            friends: [],
        }, user);
    }

    public isHomeGroup(group: IGroup): boolean {
        return group.id === (_.has(this, 'homeGroup.gid') ? this.homeGroup.gid : false);
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
        this.profile.name = `${this.profile.firstName} ${this.profile.lastInitial}.`;
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
        this.profile.name = `${firstName} ${lastInitial}.`;
        return true;
    }

    public makeHomeGroup(group: IGroup) {
        // TODO error check not duplicate add
        if (!group.members) group.members = [];
        group.members.push(new UserMember(this).toObject());
        this.homeGroup = new HomeGroup(group).toObject();
    }
}

