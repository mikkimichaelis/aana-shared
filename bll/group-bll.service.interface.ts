import { IGroup, ISchedule } from '../models';

export interface IGroupBLLService {
    orderSchedules(schedules: ISchedule[]): ISchedule[];
    getNextSchedule(now: number, schedules: ISchedule[]): ISchedule
}