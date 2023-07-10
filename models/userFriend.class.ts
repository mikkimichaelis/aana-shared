import { IUserBase } from './userBase.class';

export interface IUserFriend extends IUserBase {
    fid: string;
    requested: string;
    accepted: string;
}
