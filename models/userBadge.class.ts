import { UserBase } from './userBase.class';

export interface IUserBadge {
    gid: string;
    role: {};
    perms: {};
}

export class UserBadge extends UserBase implements IUserBadge {
    gid: string     = '';
    role: any       = null;
    perms: any      = null;

    constructor(user?: any) {
        super(user);
        this.initialize(this, user);
    }
}
