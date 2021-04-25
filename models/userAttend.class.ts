// import { FirePoint } from "geofirex";
import { IUserBase } from './userBase.class.js';
import { IId } from "./id.class.js";


export interface IUserAttend {
    id: IId;        // { id: string; }
    base: IUserBase; // { id: string; name: string; }
    
    meeting: {
        mid: string;
        start: string;
        pointStart: any;    // FirePoint;
        end: string;
        pointEnd: any;      // FirePoint;
    };
    zoom: {
        mid: string;
        zoomUser: string;
        start: string;
        ip: string;
        end: string;
    };
}
