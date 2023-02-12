import { Id, IId } from "./id.class";

export interface IJournalEntry extends IId {
    uid: string;

    gratitude: any;
    great: any;
    affirmations: any;
    highlights: any;
    better: any;
    accomplishments: any;

    date: number;
    date$: string;
}

export interface IFeeling {
    emoji: number;
    time: number;
}

export interface IDiaryEntry {
    data: any;
    time: number;
}

export class JournalEntry extends Id implements IJournalEntry {
    uid: string = '';

    feelings: IFeeling [] = [];
    diary: IDiaryEntry [] = [];

    public gratitude = { "time": 1675158624793, blocks: [{ id: JournalEntry.newId(), type: "paragraph", data: { text: 'tap here to edit' } }], "version": "2.26.4" };
    public great = { "time": 1675158624793, blocks: [{ id: JournalEntry.newId(), type: "paragraph", data: { text: 'tap here to edit' } }], "version": "2.26.4" };
    public affirmations = { "time": 1675158624793, blocks: [{ id: JournalEntry.newId(), type: "paragraph", data: { text: 'tap here to edit' } }], "version": "2.26.4" };
    public highlights = { "time": 1675158624793, blocks: [{ id: JournalEntry.newId(), type: "paragraph", data: { text: 'tap here to edit' } }], "version": "2.26.4" };
    public better = { "time": 1675158624793, blocks: [{ id: JournalEntry.newId(), type: "paragraph", data: { text: 'tap here to edit' } }], "version": "2.26.4" };
    public accomplishments  = { "time": 1675158624793, blocks: [{ id: JournalEntry.newId(), type: "paragraph", data: { text: 'tap here to edit' } }], "version": "2.26.4" };

    date: number = 0;
    date$: string = '';

    constructor(entry?: IJournalEntry) {
        super(entry);
        this.initialize(this, entry);
    }

    public static newId(): string { 
        var id = Math.random().toString(36).slice(2); 
        return id.length >= 10 ? id.slice(0, 9) : this.newId(); 
    }
}