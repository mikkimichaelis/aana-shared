import * as _ from 'lodash';
import { DateTime } from 'luxon';
import { FirePoint } from 'geofirex';

import { UserBLL, IUserFavorite, IUserFriend, IHomeGroup, IUserBase, IUserMember, UserBase, IUserActivity } from ".";

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

export class UserProfile {
    anonymous!: boolean;
    firstName!: string;
    lastInitial!: string;
    name!: string;
    bday!: string;

    constructor(user: any) {
        _.merge({
            anonymous: true,
            firstName: '',
            lastInitial: '',
            name: '',
            bday: '',
        }, user);
    }
}

export interface IUser extends UserBase {
    created: string;
    base: IUserBase;
    member: IUserMember;
    profile: IUserProfile;
    homeGroup: IHomeGroup;
    favGroups: IUserFavorite[];
    friends: IUserFriend[];
}

export class User extends UserBase implements IUser {

    created!: string;
    base!: IUserBase;
    profile!: IUserProfile;
    member!: IUserMember;
    homeGroup!: IHomeGroup;
    activity!: IUserActivity;
    favGroups!: IUserFavorite[];
    friends!: IUserFriend[];

    get daysSinceBday(): number {
        return UserBLL.daysSinceBday(this.member);
    }

    get isOnline(): boolean {
        return UserBLL.isOnline(this.activity);
    }

    constructor(user?: any) {
        super(_.merge({
            created: DateTime.local().toISO,
            base: new UserBase(user),
            profile: new UserProfile(user),
            member: {},
            homeGroup: {},
            favGroups: [],
            friends: [],
        }, user));
    }
}

