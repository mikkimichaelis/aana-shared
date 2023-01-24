import { SettingsBase } from './settings-base';

// ordering here is important
export enum SpecificDay {
    'any' = 0,		// flag 0 any
    'Monday',		// 1 ISO Monday
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
    'Sunday',		// 7 ISO Sunday
    'today'			// flag 8 today
};

export enum SearchType {
    'search' = 'search',
    'live' = 'live',
    'upcoming' = 'upcoming',
    'owned' = 'owned',
    'favorite' = 'favorite'
};

export interface ISearchSettings {
    version: number,

    resetIndex: boolean,
    searchType: SearchType,

    // These relative are converted into bySpecificTimeRange values
    bySpecificDay: SpecificDay,		// null || SpecificDay.[any, Monday, ... today]
    byCurrentTime: boolean,

    bySpecificTimeRange: any,   	// null || { start: string, end: string }

    live: boolean,					// Include live meetings in search results
    continuous: boolean,			// Include continuous meetings in search results

    zid: string,
    name: string,					
    zipcode: string,			
    language: string,
    groupType: string,
    meetingType: string,
    tags: string[],
    tagsAny: boolean,
};

export class SearchSettings extends SettingsBase implements ISearchSettings {
    // Default Values
    version = 2;
    resetIndex = false;
    searchType = SearchType.search;

    bySpecificDay = SpecificDay.today;
    byCurrentTime = true;
    bySpecificTimeRange = null;

    live = true;
    continuous = false;

    zid = <any>null;
    name = <any>null;
    zipcode = <any>null;
    language = <any>null;
    groupType = <any>null;
    meetingType = <any>null;
    tags: string[] = [];
    tagsAny: boolean = false;

    constructor(settings?: ISearchSettings) {
        super();
        this.update(settings, this.version);
    }
}
