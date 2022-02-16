import { DateTime } from 'luxon';
import { Base } from '../models/base.class';
import { Id, IId } from '../models/id.class';
export interface IDevice extends IId {
    uid: string
    timezone: string;       // tz of user at time of attendance
    updated: number;        // server utc millis last updated
    updated$: string;
    created: number;        // server utc millis created
    created$: string;

    // Device values
    cordova: any;
    model: any;
    uuid: any;
    version: any;
    manufacturer: any;
    isVirtual: any;
    serial: any;
    platform: any;          // shared in both Device and Browser

    // Browser values
    appCodeName: any;
    appName: any;
    appVersion: any;
    language: any;
    product: any;
    productSub: any;
    userAgent: any;
    vendor: any
    vendorSub: any;

    update(): IDevice;
}

export class Device extends Base implements IDevice {
    id: string = <any>null;
    uid: string = '';
    timezone: string = DateTime.now().zoneName;
    updated: number = 0;                // update() populated millis
    updated$: string = '';              // update() populated local tz datetime string
    created: number = DateTime.now().toMillis();
    created$: string = DateTime.now().toISO();

    cordova: any = null;
    model: any = null;
    platform: any = null;
    uuid: any = null;
    version: any = null;
    manufacturer: any = null;
    isVirtual: any = null;
    serial: any = null;

    // Browser values
    appCodeName: any = null;
    appName: any = null;
    appVersion: any = null;
    language: any = null;
    product: any = null;
    productSub: any = null;
    userAgent: any = null;
    vendor: any = null;
    vendorSub: any = null;

    constructor(device?: any) {
        super();
        this.initialize(this, device);
        if (!this.id) {
            if (device.id) {
                this.id = device.id;
            } else if (device.uuid) {
                this.id = device.uuid;
            } else if (device.userAgent) {
                this.id = device.userAgent;
            }
        }
    }

    public update(): IDevice {
        this.updated = DateTime.now().toMillis();
        this.updated$ = DateTime.fromMillis(this.updated).setZone(this.timezone).toFormat('FFF');
        this.created$ = DateTime.fromMillis(this.created).setZone(this.timezone).toFormat('FFF');
        return this;
    }
}