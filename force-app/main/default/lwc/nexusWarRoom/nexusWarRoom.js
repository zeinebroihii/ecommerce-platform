import { LightningElement, track } from 'lwc';

const MESSAGES = [
    'Alerte : Stock critique (1 unité restante)',
    'Nouveau bid de Global Tech Corp : +5,000€',
    'Euro Systems Ltd demande une révision du discount',
    'Nexus AI : Probabilité de vente immédiate 94%',
    'Attention : APAC Innovations perd du terrain',
    'Strategist SM a rejoint la War Room #1',
];

const INITIAL_ROOMS = [
    { id: '1', account: 'Global Tech Corp',  bid: 125000, discount: 5,  status: 'leading',   lastAction: 'Increased bid by 10k', participants: 4 },
    { id: '2', account: 'Euro Systems Ltd',  bid: 118000, discount: 8,  status: 'competing', lastAction: 'Requested 2% more discount', participants: 3 },
    { id: '3', account: 'APAC Innovations',  bid: 112000, discount: 12, status: 'at-risk',   lastAction: 'Waiting for approval', participants: 6 },
];

export default class NexusWarRoom extends LightningElement {

    @track isLive     = true;
    @track myBid      = 130000;
    @track myDiscount = 5;
    @track dealRooms  = JSON.parse(JSON.stringify(INITIAL_ROOMS));
    @track logs       = [];

    _interval;

    /* ── Lifecycle ── */

    connectedCallback() {
        this._interval = setInterval(() => this._tick(), 3000);
    }

    disconnectedCallback() {
        clearInterval(this._interval);
    }

    /* ── Computed ── */

    get topRoom()          { return this.dealRooms[0] || { bid: 0, account: 'N/A' }; }
    get topBidFormatted()  { return `${this.topRoom.bid.toLocaleString()}€`; }
    get topBidK()          { return `${(this.topRoom.bid / 1000).toFixed(1)}k€`; }
    get topBidSuggested()  { return `${(this.topRoom.bid + 5000).toLocaleString()}€`; }
    get topAccount()       { return this.topRoom.account; }
    get myBidFormatted()   { return `${this.myBid.toLocaleString()}€`; }
    get myDiscountFormatted() { return `${this.myDiscount}%`; }
    get hasLogs()          { return this.logs.length > 0; }

    get dealRoomItems() {
        return this.dealRooms.map((room, i) => ({
            ...room,
            position: i + 1,
            bidFormatted: `${room.bid.toLocaleString()}€`,
            isLeading: room.status === 'leading',
            rowCls: room.status === 'leading' ? 'nwr-room-row nwr-room-row--leading' : 'nwr-room-row',
            posCls: room.status === 'leading' ? 'nwr-room-pos nwr-room-pos--leading' : 'nwr-room-pos',
            nameCls: room.status === 'leading' ? 'nwr-room-name nwr-room-name--leading' : 'nwr-room-name',
            bidCls: room.status === 'leading' ? 'nwr-room-bid nwr-room-bid--leading' : 'nwr-room-bid',
        }));
    }

    get logItems() {
        return this.logs.map(log => ({
            ...log,
            sourceCls: log.type === 'warning' ? 'nwr-log-source nwr-log-source--warning'
                     : log.type === 'success'  ? 'nwr-log-source nwr-log-source--success'
                     :                           'nwr-log-source nwr-log-source--info',
        }));
    }

    /* ── Handlers ── */

    handleToggleLive() { this.isLive = !this.isLive; }

    handleBidChange(event) {
        this.myBid = parseInt(event.target.value, 10);
    }

    handleDiscountChange(event) {
        this.myDiscount = parseInt(event.target.value, 10);
    }

    handlePlaceBid() {
        const ts = new Date().toLocaleTimeString('fr-FR', { hour12: false });
        const entry = {
            id: Date.now().toString(36),
            timestamp: ts,
            type: 'success',
            message: `VOTRE BID : ${this.myBid.toLocaleString()}€ avec ${this.myDiscount}% discount a été soumis.`,
            source: 'User Action',
        };
        this.logs = [entry, ...this.logs];

        // Add user entry to rooms
        const userRoom = {
            id: 'user', account: 'VOUS (Strategic Partner)',
            bid: this.myBid, discount: this.myDiscount,
            status: 'leading', lastAction: 'Just placed bid', participants: 1,
        };
        const merged = [...this.dealRooms.filter(r => r.id !== 'user'), userRoom];
        this.dealRooms = this._rankRooms(merged);
    }

    /* ── Private ── */

    _tick() {
        if (!this.isLive) return;
        this._updateRooms();
        this._addLog();
    }

    _updateRooms() {
        const updated = this.dealRooms.map(room => {
            if (Math.random() > 0.7) {
                const inc = Math.floor(Math.random() * 5000);
                return { ...room, bid: room.bid + inc, lastAction: `Bid increased by ${inc}€` };
            }
            return { ...room };
        });
        this.dealRooms = this._rankRooms(updated);
    }

    _rankRooms(rooms) {
        return rooms
            .sort((a, b) => b.bid - a.bid)
            .map((r, i) => ({ ...r, status: i === 0 ? 'leading' : i === 1 ? 'competing' : 'at-risk' }));
    }

    _addLog() {
        const ts = new Date().toLocaleTimeString('fr-FR', { hour12: false });
        const entry = {
            id: Date.now().toString(36) + Math.random().toString(36).slice(2, 5),
            timestamp: ts,
            type: Math.random() > 0.8 ? 'warning' : 'info',
            message: MESSAGES[Math.floor(Math.random() * MESSAGES.length)],
            source: 'Nexus Deal Engine',
        };
        this.logs = [entry, ...this.logs].slice(0, 50);
    }
}
