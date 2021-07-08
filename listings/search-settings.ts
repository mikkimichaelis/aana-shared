import _ from 'lodash';
import { environment } from '../../environments/environment';

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
	'owned' = 'owned',
	'favorite' = 'favorite'
};

export interface ISearchSettings {
	version: number,			
	searchType: SearchType,
	
	bySpecificDay: SpecificDay,		// null || SpecificDay.[any, Monday, ... today]
	byCurrentTime: boolean,
	bySpecificTimeRange: any,   	// null || { start: string, end: string }
	
	live: boolean,					// Include live meetings in search results
	continuous: boolean,			// Include continuous meetings in search results

	id: string,						// TODO change to zid
	name: string,					// TODO expand to name_word[] matching
	zipcode: string,				// TODO
	language: string,
	groupType: string,
	meetingType: string,
	tags: string[],
	tagsAny: boolean,
};

export class SearchSettings implements ISearchSettings {
	version = null;
	searchType = null;

	bySpecificDay = null;
	byCurrentTime = true;
	bySpecificTimeRange = null;
	
	live = true;
	continuous = true;

	id = <any>null;
	name = <any>null;
	zipcode = <any>null;
	language = <any>null;
	groupType = <any>null;
	meetingType = <any>null;
	tags: string[] = [];
	tagsAny: boolean = false;

	constructor(searchSettings?: ISearchSettings) {
		if (!_.isNil(searchSettings) && searchSettings.version !== undefined) {
			if (environment.searchSettings.version > searchSettings.version) {
				// old version searchSettings, use new searchSettings
				// TODO add upgrade path of settings...
				searchSettings = <any>environment.searchSettings;
			}
		} else {
			// pre-version searchSettings, use new searchSettings
			searchSettings = <any>environment.searchSettings;
		}

		_.merge(this, searchSettings);
	}
};