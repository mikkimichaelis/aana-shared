import _ = require("lodash");
import { IHomeGroup, IUserActivity } from ".";
import { UserBLL } from './user.bll';
import { UserBase } from './userBase.class';

// Member of a homegroup
export interface IUserMember {
    aid: string;    // aid in UsersActivity collection
    bday: string;
    homeGroup: IHomeGroup;
    lastActivity: IUserActivity;
}

export class UserMember extends UserBase implements IUserMember {
    aid!: string;        // Admin
    bday!: string;
    homeGroup!: IHomeGroup;
    lastActivity!: IUserActivity;

    get daysSinceBday(): number {
        return UserBLL.daysSinceBday(this);
    }

    get isOnline(): boolean {
        return UserBLL.isOnline(this.lastActivity);
    }

    constructor(user?: any) {
        super(_.merge({
        }, user));
        this.bday = user.bday;
        this.homeGroup = user.homeGroup;
        this.lastActivity = user.lastActivity;
    }
}
