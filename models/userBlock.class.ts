
export interface IUserBlock {
    uid: string; // blocker user id
    bid: string; // blocked user id
    reason: string; // for reporting abusive users
    date: string;
    active: boolean;
}
