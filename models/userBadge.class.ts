import { IUserBase } from './userBase.class';
import { IId } from "./id.class";

// Badge
export interface IBadge {
    id: IId;        // { id: string; }
    bid: string;     // admin id
    uid: string;
    gid: string;
    rid: string;    // region id 
    trace: {}       
}

export interface IUserBadge {
    id: IId;        // { id: string; }
    base: IUserBase; // { id: string; name: string; }

    bid: IBadge;    // badge id

    role: {};
    perms: {};
}
