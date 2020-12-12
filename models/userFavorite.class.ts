import { IBase } from "./base.class";


export interface IUserFavorite extends IBase {
    gid: string; // group id
    sid: string; // schedule id
    active: boolean;
}
