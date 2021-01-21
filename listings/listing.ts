import _ from "lodash";
import { Id, IId } from "../models/id.class";
import { ISchedule, Schedule } from "../models/schedule.class";

export interface IListing extends IId {
    ownerId: string;
    name: string;
    zoomId: string;
    zoomPw: string;
    start: string;
    topic: string;

    schedule: ISchedule;
}

export class Listing extends Id {
    ownerId: string;
    name: string;
    zoomId: string;
    zoomPw: string;
    start: string;
    topic: string;

    schedule: ISchedule;

    constructor(listing?: any) {
        super(listing);
        this.initialize(this, listing);
        
        // Create Custom Object Properties
        if (_.has(listing, 'schedule') && !_.isEmpty(listing.schedule)) this.schedule = new Schedule(listing.schedule);
    }
}