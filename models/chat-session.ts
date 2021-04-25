import { IUserBase } from './userBase.class';

export interface IChatSession {
    id: string;
    participants: IUserBase;
    messages: string[];
}