import { Injectable } from '@angular/core';

import * as luxon from 'luxon';

import { ISchedule } from '../models';
import { IGroupBLLService } from '../../shared/bll';

@Injectable({
  providedIn: 'root'
})
export class GroupBLLService implements IGroupBLLService {

  constructor() { }

  orderSchedules(schedules: ISchedule[]): ISchedule[] {
    let week = 7 * 24 * 60 * 1000;  // 1 week in ms
    let now: any = luxon.DateTime.local();
    now = luxon.DateTime.fromObject({ year: 1970, month: 1, day: now.weekday, hour: now.hour, minute: now.min, second: now.second });
    now = now.toMillis();
    let rv: ISchedule[] = [];
    schedules.forEach(s => {
      const x = this.getNextSchedule(now, schedules);
      rv.push(x);
      now = x.millis + 1;
    });
    return rv;
  }

  public getNextSchedule(now: number, schedules: ISchedule[]): ISchedule {
    let rv: ISchedule;
    schedules.forEach(schedule => {
      // ignore if not active
      if (schedule.active) {
        if (!rv) {  // special handle if no schedule yet
          if (schedule.millis < now) {
            // s happens next week if recurring otherwise ignore
            rv = schedule.recurring ? schedule : null;
          } else {
            // s happens this week
            rv = schedule;
          }
        } else if (schedule.millis > now) {
          // s happens this week
          rv = schedule.millis < rv.millis ? schedule : rv; // s comes before schedule
        } else if (schedule.recurring) {
          // s happens next week
          if (rv.millis < now) { // schedule also happens next week
            rv = schedule.millis < rv.millis ? schedule : rv; // s comes before schedule next week
          } else {
            // schedule happens this week so keep it
            // schedule = schedule;
          }
        }
      }
    });
    return rv;
  }
}
