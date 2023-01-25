import { merge } from "lodash";

export  class SettingsBase {
    constructor() {}

    public update(settings: any, version: number) {
        if (settings) {
			if (settings.version !== version) {
                // This allows for settings changes due to an upgrade
                // Most likely unnecessary.
                // update values directly on settings to be merged below
			} 

            merge(this, settings);  // overwrite with persisted settings
		} 
    }
}