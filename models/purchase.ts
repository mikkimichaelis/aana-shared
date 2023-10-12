import { DateTime } from "luxon";

export class Purchase {
    purchaseId: string = '';
    transactionId: string = '';
    productId: string = '';
    platform: string = '';
    sandbox: boolean = false;
    purchaseDate: string = '';
    lastRenewalDate: string = '';
    expirationDate: string = '';
    renewalIntent: string = '';
    renewalIntentChangeDate: string = '';
    cancelationReason: string = '';
    isPending: boolean = false;;
    isAcknowledged: boolean = false;
    isConsumed: boolean = false;
    isBillingRetryPeriod: boolean = false;
    isTrialPeriod: boolean = false;
    isIntroPeriod: boolean = false;
    priceConsentStatus: string = '';
    discountId: string = '';
    quantity: number = 0;
    currency: string = '';
    isSharedPurchase: boolean = false;
    isExpired: boolean = false;
    entitledUsers: any[] = [];

    _owned: boolean = false;
    _trial: boolean = false;
    _lapse: boolean = false;
    _free: boolean = false;
    _new: boolean = false;

    _purchaseDate: DateTime = null as any;
    _expirationDate: DateTime = null as any;

    constructor(data) {
        Object.assign(this, data);

        this._purchaseDate = DateTime.fromISO(this.purchaseDate);
        this._expirationDate = DateTime.fromISO(this.expirationDate);
        // const t = transactions.find(t => t.transactionId === this.transactionId)

        this._trial = this.isIntroPeriod
        this._lapse = this.renewalIntent === 'Lapse';
        this._owned = this._expirationDate > DateTime.now();
        this._new = this._purchaseDate > DateTime.now().startOf('day');
    }
}
