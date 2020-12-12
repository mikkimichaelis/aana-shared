import * as _ from 'lodash';
import { DateTime } from 'luxon';
import { FirePoint } from 'geofirex';

import { IUserBase, UserBase } from './userBase.class';
import { IUserFavorite, IUserFriend, IHomeGroup, IUserMember, IUserActivity } from ".";
import { UserBLL } from '../bll';
import { Base } from './base.class';

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

export class UserProfile extends Base {
    anonymous!: boolean;
    firstName!: string;
    lastInitial!: string;
    name!: string;
    bday!: string;

    constructor(user?: any) {
        super(_.merge({
            anonymous: true,
            firstName: 'Anonymous',
            lastInitial: '',
            name: 'Anonymous',
            bday: '',
        }, user));
    }
}

export interface IUser {
    member: IUserMember;
    profile: IUserProfile;
    homeGroup: IHomeGroup;
    favGroups: IUserFavorite[];
    friends: IUserFriend[];
    created: string;
}

export class User extends UserBase implements IUser {
    profile!: IUserProfile;
    member!: IUserMember;
    homeGroup!: IHomeGroup;
    activity!: IUserActivity;
    favGroups!: IUserFavorite[];
    friends!: IUserFriend[];
    created!: string;

    get daysSinceBday(): number {
        return UserBLL.daysSinceBday(this.member);
    }

    get isOnline(): boolean {
        return UserBLL.isOnline(this.activity);
    }

    constructor(user?: any) {
        super(user, {
            created: DateTime.local().toISO(),
            profile: new UserProfile(),
            member: {},
            homeGroup: {},
            favGroups: [],
            friends: [],
        });
    }
}

