import { Base, IBase } from "../models/base.class";

export enum RecurrenceType {
    NONE = '',
    CONTINUOUS = 'Continuous',
    DAILY = 'Daily',
    WEEKLY = 'Weekly'
}

export interface IRecurrence extends IBase {
    type:               RecurrenceType;     
    weekly_day:         string;
    weekly_days:        string[];
} 

export class Recurrence extends Base implements IRecurrence {
    type:               RecurrenceType  = RecurrenceType.NONE;
    
    weekly_day:         string  = '';
    weekly_days:        string[] = [];

    constructor(irecurrence: any) {
        super();
        this.initialize(this, irecurrence);
    }
}