export interface IPost {
    gid: string;
    uid: string;
    aid: string;        // approved by uid
    date: string;
    topic: string;
    header: string;     // html
    content: string;    // html
    active: boolean;
    // no likes or comments on posts... no controversy
}