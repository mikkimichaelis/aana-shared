import { IUserBase } from './userBase.class.js';

export interface IUserFriend extends IUserBase {
    fid: string;
    requested: string;
    accepted: string;
}
