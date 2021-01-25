import _ from "lodash";

export interface IRecurrence {
    type:               string;     
    repeat_interval:    number;
    weekly_day:         string;
    weekly_days:        string[];
    monthly_day:        number;
    monthly_week:       number;
    monthly_week_day:   number;
    end_times:          number;
    end_date_time:      string;
} 

export class Recurrence implements IRecurrence {
    type:               string  = 'Daily';
    repeat_interval:    number  = null;
    weekly_day:         string  = 'Sunday';
    weekly_days:        string[] = [];
    monthly_day:        number;
    monthly_week:       number;
    monthly_week_day:   number;
    end_times:          number;
    end_date_time:      string;
}