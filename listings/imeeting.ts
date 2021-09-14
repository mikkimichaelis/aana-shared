import { DateTime } from "luxon";
import { User } from "../models";
import { IId } from "../models/id.class";
import { IRecurrence } from "./recurrence";

export interface IMeeting extends IId {

    iid: string;    // import id

    uid: string;
    isZoomOwner: boolean;

    active: boolean;
    verified: boolean;
    authorized: boolean;

    verified_count: number;
    password_count: number;
    waiting_count: number;
    nothing_count: number;

    isVerified: boolean;

    meetingUrl: string;
    homeUrl: string;
    sourceUrl: string;

    zid: string;
    password: string;
    requiresLogin: boolean;
    closed: boolean;
    restricted: boolean;
    restrictedDescription: string;

    language: string;
    postal: string;
    location: string;

    group: string;
    groupType: string;

    meetingTypes: string[];         // tags[]

    name: string;
    description: string;
    description_links: string[];    // url/email 
    
    tags_custom: string[];

    tags_custom_: string[];        
    tags_description_: string[];
    tags_name_: string[];           // toLower()
    tags_location_: string[];
    
    tags_: string[];                // meetingTypes + tags_description_ + tags_name_ + tags_custom_ + tags_location_

    continuous: boolean;

    parent: string;
    recurrence: IRecurrence;
    siblings: string[];
    
    timezone: string;
    time24h: string;                // HH:MM
    duration: number;

    // startTime/endTime creates a window of time which can be searched for containing a specific point in time 
    // this is used to search where specificDay is any
    startTime: number;              // Millisecond UTC 0 time offset of 1/1/1970 + timezone + startTime
    startTime$: string;             // 'ffff' formatted startTime in timezone
    endTime: number;                // startTime + duration

    // startDateTime is a point in time this meeting starts which can be searched for within a window of time
    // this is used to search for meetings withing a specific day
    startDateTime: number;          // Absolute start DateTime in UTC of Meeting startTime + weekday in Meeting timezone 
    endDateTime: number;            // that70sDateTime

    buymeacoffee: string;

    // Non serialized getter properties
    isLive: boolean | null;
    startTimeString: string | null;
    daytimeString: string | null;
    nextTimeEnd: DateTime | null;
    nextTime: DateTime | null;
    startTimeFormat: string | null;
    startTimeFormatLocal: DateTime | null;
    meetingTypesString: string;
    tagsString: string;
    meetingSub: string;
    weekday: number;
    tags: string[];
    // makeLocalStartDateTime: DateTime;
    
    updateDayTime(): void;
    updateTags(): void;

    isHome(user: User): boolean;       // TODO remove

    destroy(): void;
}