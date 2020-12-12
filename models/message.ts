export interface IMessage extends IMessageStub {
    gid: string;         // group id (if group message)
    fuid: string;       // from user id
    tuid: string;       // to user id
    text: string;
}

export interface IMessageStub {
    mid: string;        // message id
    fname: string;      // from name
    tname: string;      // to name
    subject: string;
    sent: string;       // date
    read: string;       // date
}