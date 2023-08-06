import { Base, IBase } from "../models/base.class";

export enum RecurrenceType {
    NONE = '',
    CONTINUOUS = 'Continuous',
    DAILY = 'Daily',
    WEEKLY = 'Weekly'
}

export interface IRecurrence extends IBase {
    type:               RecurrenceType;     
    repeat_interval:    number;
    weekly_day:         string;
    weekly_days:        string[];
    monthly_day:        number;
    monthly_week:       number;
    monthly_week_day:   number;
    end_times:          number;
    end_date_time:      string;
} 

export class Recurrence extends Base implements IRecurrence {
    type:               RecurrenceType  = RecurrenceType.NONE;
    
    weekly_day:         string  = '';
    weekly_days:        string[] = [];

    // TODO Unused
    repeat_interval:    number  = 0;
    monthly_day:        number = 0;
    monthly_week:       number = 0;
    monthly_week_day:   number = 0;
    end_times:          number = 0;
    end_date_time:      string = '';

    constructor(irecurrence: any) {
        super();
        this.initialize(this, irecurrence);
    }
}