import { AnyCatcher } from "rxjs/internal/AnyCatcher";
import { Id } from "./id.class";

/*
    These are the specific app features to analyze activity on
*/
export enum EventType {
    START,              // App start
    VIEW,               // Page view
    JOIN,               // Meeting Join
    JOIN_ANY,           // join any
    SEARCH,             // perform search
    FAVORITE,           // Add/remove
    JOURNAL,            // Journal entry created/viewed
    TUTORIAL,           // access tutorial
    RESOURCES,          // access any functionality within resources
    PROFILE,            // access any functionality within profile
    SETTINGS,           // access any functionality within settings
    ACCOUNT,            // access any functionality within account
    SUBSCRIBE,          // subscribe event!!!
    ABOUT,              // access any functionality within about
    CLEAN_DATE,         // set clean date
    MEETING_CALENDAR,   // access calendar
    NINETY_NINETY,      // reset
    ATTENDANCE,         // created
    REPORT,             // view attendance report
    SEND,               // send attendance report
    REMINDER,           // CREATE/OPENED
    REMINDERS_CALENDAR, // 
    RATING,
    PING,               // ping
}

// These indicate the generic actions taken by an event
export enum EventAction {
    CREATED,
    VIEWED,
    OPENED,             
    ADDED,
    REMOVED,
    UPDATED,
}

export interface IEvent { 
    id: string;
    ip: string;
    timestamp: number;
}

export class Event extends Id implements IEvent {
    hash: string;               // hashed value for event grouping
    ip: string;                 // ip address
    url: string;                // app current url
    type: EventType;    
    action: EventAction;
    feature: string;            // feature-specific-identifier
    data: any;                  // additional data associated with event
    timestamp: number;

    constructor(event?: any) {
        super(event);
        this.initialize(this, event);
    }
}