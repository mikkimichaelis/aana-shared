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

    public gratitude = '';
    public great = '';
    public affirmations = '';
    public highlights = '';
    public better = '';
    public accomplishments  = '';

    date: number = 0;
    date$: string = '';

    constructor(entry?: IJournalEntry) {
        super(entry);
        this.initialize(this, entry);
    }
}