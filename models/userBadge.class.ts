import { IUserBase, UserBase } from './userBase.class';
import { IId } from "./id.class";

export interface IUserBadge {
    gid: string;
    role: {};
    perms: {};
}

export class UserBadge extends UserBase implements IUserBadge {
    gid: string     = '';
    role: {}        = null;
    perms: {}       = null;

    constructor(user?: any) {
        super(user);
        this.initialize(this, user);
    }
}
