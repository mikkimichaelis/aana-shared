import { IUserBase } from '.';


export interface IUserFriend extends IUserBase {
    fid: string;
    requested: string;
    accepted: string;
}
