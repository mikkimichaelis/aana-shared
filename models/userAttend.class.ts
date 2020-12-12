import { FirePoint } from "geofirex";
import { IUserBase } from './userBase.class';
import { IId } from "./id.class";


export interface IUserAttend {
    id: IId;        // { id: string; }
    base: IUserBase; // { id: string; name: string; }
    
    meeting: {
        mid: string;
        start: string;
        pointStart: FirePoint;
        end: string;
        pointEnd: FirePoint;
    };
    zoom: {
        mid: string;
        zoomUser: string;
        start: string;
        ip: string;
        end: string;
    };
}
