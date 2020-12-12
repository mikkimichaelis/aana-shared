import { IUserBase } from '.';

export interface IChatSession {
    id: string;
    participants: IUserBase;
    messages: string[];
}