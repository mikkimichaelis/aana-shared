import { IUserBase } from './userBase.class.js';

export interface IChatSession {
    id: string;
    participants: IUserBase;
    messages: string[];
}