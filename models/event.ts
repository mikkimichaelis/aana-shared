import { DateTime } from "luxon";
import { Id } from "./id.class";

/*
    These are the specific app features to analyze activity on
*/
export enum EventType {
    VIEW                = 'VIEW',               // Page view
    JOIN                = 'JOIN',               // Meeting Join
    VERIFICATION        = 'VERIFICATION',       // meeting verification events
    JOIN_ANY            = 'JOIN_ANY',           // join any
    SEARCH              = 'SEARCH',             // perform search
    FAVORITE            = 'FAVORITE',           // Add/remove
    JOURNAL             = 'JOURNAL',            // Journal entry created/viewed
    TUTORIAL            = 'TUTORIAL',           // access tutorial
    RESOURCES           = 'RESOURCES',          // access any functionality within resources
    PROFILE             = 'PROFILE',            // access any functionality within profile
    SETTINGS            = 'SETTINGS',           // access any functionality within settings
    PREFERENCES         = 'PREFERENCES',        // changing preferences
    ACCOUNT             = 'ACCOUNT',            // access any functionality within account
    SUBSCRIBE           = 'SUBSCRIBE',          // subscribe event!!!
    ABOUT               = 'ABOUT',              // access any functionality within about
    CLEAN_DATE          = 'CLEAN_DATE',         // set clean date
    MEETING_CALENDAR    = 'MEETING_CALENDAR',   // access calendar
    NINETY_NINETY       = 'NINETY_NINETY',      // reset
    ATTENDANCE          = 'ATTENDANCE',         // created
    REPORT              = 'REPORT',             // view attendance report
    SEND                = 'SEND',               // send attendance report
    REMINDER            = 'REMINDER',           // CREATE/OPENED
    REMINDERS_CALENDAR  = 'REMINDERS_CALENDAR', // reminders calendar
    RATING              = 'RATING',             // rating
    PING                = 'PING',               // ping
}

// These indicate the specific actions taken by an event and are not required
export enum EventAction {
    CREATED     = 'CREATED',
    VIEWED      = 'VIEWED',
    OPENED      = 'OPENED',             
    ADDED       = 'ADDED',
    REMOVED     = 'REMOVED',
    UPDATED     = 'UPDATED',
}

export interface IEvent { 
    id: string;
    identifier: string;
    ip: string;
    url: string;
    type: EventType;
    action: EventAction;
    feature: string;        // feature is an arbitrary string to group events together by specific feature
    data: any;
    geolocation: any;
    timestamp: number;
}

export class Event extends Id implements IEvent {
    identifier = '';        // hashed value for event grouping
    ip = '';                // ip address
    url = '';               // app current url
    type = null;    
    action = null;
    feature = '';           // feature-specific-identifier
    data = null;            // additional data associated with event
    geolocation = null;     // geolocation of ip address
    geohash = null;
    timestamp = DateTime.now().toMillis();

    constructor(event?: any) {
        super(event);
        this.initialize(this, event);
    }
}