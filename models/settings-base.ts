import { merge } from "lodash";

export  class SettingsBase {
    constructor() {}

    public update(settings: any, version: number) {
        if (settings) {
			if (settings.version !== version) {
                // TODO add array of properties specified to be upgraded..array of array to preserve upgrade path.
                // Ie merge settings, then cherry pick setting updates.
                // Nothing to do atm (I'm trying to release v2), the children classes will contain default settings values.
                // discard settings..... :-(
			} else {
				merge(this, settings);  // overwrite with persisted settings
			}
		} 
    }
}