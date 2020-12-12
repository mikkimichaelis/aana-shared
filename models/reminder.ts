export interface IReminder {
    uid: string;
    sid: string;
    mid: string;
    created: string;
    active: boolean;
    next: string;
    recurring: boolean;
    message: string;
}