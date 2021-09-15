import { DateTime } from 'luxon';
import { Id, IId } from '../models/id.class';


export interface IDevice extends IId {
    timezone: string;       // tz of user at time of attendance
    updated: number;        // server utc millis last updated
    updated$: string;
    created: number;        // server utc millis created
    created$: string;

    cordova: any;
    model: any;
    platform: any;
    uuid: any;
    version: any;
    manufacturer: any;
    isVirtual: any;
    serial: any;

    update(): IDevice;
}

export class Device extends Id implements IDevice {
    id: string = '';                    // device.uuid
    
    timezone: string = DateTime.now().zoneName;
    created: number = DateTime.now().toMillis();                // server populated millis
    created$: string = DateTime.now().toISO();
    updated: number = 0;                // server populated millis
    updated$: string = '';              // server populated local tz datetime string
    
    cordova: any = null;
    model: any = null;
    platform: any = null;
    uuid: any = null;
    version: any = null;
    manufacturer: any = null;
    isVirtual: any = null;
    serial: any = null;

    constructor(device?: any) {
        super(device);
        this.initialize(this, device);
        this.id = device.uuid;
    }

    public update(): IDevice {
        this.updated = DateTime.now().toMillis();
        this.updated$ = DateTime.fromMillis(this.updated).setZone(this.timezone).toFormat('FFF');
        this.created$ = DateTime.fromMillis(this.created).setZone(this.timezone).toFormat('FFF');
        return this;
    }
}