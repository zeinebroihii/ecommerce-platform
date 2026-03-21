import { LightningElement, track } from 'lwc';

const MOCK_SWAP_ITEMS = [
    {
        id: '1', name: 'Nexus Hub v2', image: 'https://picsum.photos/seed/hub/400/400',
        owner: 'Jean D.', condition: 'Mint', category: 'Hardware', co2Saved: 12.5, verified: true,
        ownerRating: 4.8, ownerSwapCount: 12,
        ownerReviews: [
            { author: 'Sophie M.', stars: 5, text: 'Produit exactement comme décrit, échange fluide et rapide.', date: 'Fév 2025' },
            { author: 'Marie L.',  stars: 5, text: 'Très réactif, emballage soigné. Je recommande !', date: 'Jan 2025' },
            { author: 'Pierre K.', stars: 4, text: 'Bonne communication, quelques jours de délai mais rien de grave.', date: 'Déc 2024' }
        ]
    },
    {
        id: '2', name: 'Smart Sensor Pack', image: 'https://picsum.photos/seed/sensor/400/400',
        owner: 'Marie L.', condition: 'Good', category: 'IoT', co2Saved: 5.2, verified: true,
        ownerRating: 4.5, ownerSwapCount: 7,
        ownerReviews: [
            { author: 'Jean D.',   stars: 5, text: 'Super échange, produit en parfait état.', date: 'Mar 2025' },
            { author: 'Sophie M.', stars: 4, text: 'Bonne expérience globale, communication rapide.', date: 'Jan 2025' }
        ]
    },
    {
        id: '3', name: 'Legacy Controller', image: 'https://picsum.photos/seed/controller/400/400',
        owner: 'Pierre K.', condition: 'Fair', category: 'Hardware', co2Saved: 8.7, verified: false,
        ownerRating: 3.9, ownerSwapCount: 3,
        ownerReviews: [
            { author: 'Marie L.', stars: 4, text: 'Produit correct, description honnête sur l\'état.', date: 'Fév 2025' },
            { author: 'Jean D.',  stars: 3, text: 'Swap was a bit slow but went well in the end.', date: 'Nov 2024' }
        ]
    },
    {
        id: '4', name: 'Nexus Bridge Pro', image: 'https://picsum.photos/seed/bridge/400/400',
        owner: 'Sophie M.', condition: 'Mint', category: 'Connectivity', co2Saved: 15.1, verified: true,
        ownerRating: 5.0, ownerSwapCount: 21,
        ownerReviews: [
            { author: 'Jean D.',   stars: 5, text: 'Perfect swap, very professional. Best swap I\'ve done!', date: 'Mar 2025' },
            { author: 'Marie L.', stars: 5, text: 'Rapide, fiable, produit impeccable. 5 étoiles sans hésiter.', date: 'Mar 2025' },
            { author: 'Pierre K.', stars: 5, text: 'Transaction exemplaire, je recommande vivement.', date: 'Fév 2025' }
        ]
    }
];

const CATEGORIES = ['All', 'Hardware', 'IoT', 'Connectivity'];

export default class NexusSwap extends LightningElement {

    @track activeCategory    = 'All';
    @track searchQuery       = '';
    @track selectedItem      = null;
    @track showPassport      = false;
    @track showOwnerReviews  = false;
    @track requests          = [];
    @track activeRequest     = null;
    @track messageInput      = '';
    @track showReview        = false;
    @track rating            = 0;
    @track offeredItem       = 'Nexus Sensor Pack (v1)';

    _reqCounter   = 1000;
    _responseTimer;

    disconnectedCallback() {
        clearTimeout(this._responseTimer);
    }

    /* ── Category / Search ── */

    get categoryFilters() {
        return CATEGORIES.map(cat => ({
            id  : cat,
            label: cat,
            cls : cat === this.activeCategory ? 'ns-pill ns-pill--active' : 'ns-pill'
        }));
    }

    get filteredItems() {
        const q = this.searchQuery.toLowerCase();
        return MOCK_SWAP_ITEMS.filter(item => {
            const matchCat  = this.activeCategory === 'All' || item.category === this.activeCategory;
            const matchName = !q || item.name.toLowerCase().includes(q);
            return matchCat && matchName;
        });
    }

    handleCategoryChange(event) {
        this.activeCategory = event.currentTarget.dataset.category;
    }

    handleSearch(event) {
        this.searchQuery = event.target.value;
    }

    /* ── Swap modal ── */

    get isSwapModalOpen()       { return !!this.selectedItem; }
    get selectedItemName()      { return this.selectedItem ? this.selectedItem.name      : ''; }
    get selectedItemImage()     { return this.selectedItem ? this.selectedItem.image     : ''; }
    get selectedItemCategory()  { return this.selectedItem ? this.selectedItem.category  : ''; }
    get selectedItemCondition() { return this.selectedItem ? this.selectedItem.condition : ''; }
    get selectedItemCo2()       { return this.selectedItem ? this.selectedItem.co2Saved  : 0;  }
    get selectedItemId()        { return this.selectedItem ? this.selectedItem.id        : '';  }
    get selectedItemOwner()     { return this.selectedItem ? this.selectedItem.owner       : ''; }

    get selectedItemIsNewSwapper() { return !this.selectedItem || this.selectedItem.ownerSwapCount === 0; }

    get ownerInitials() {
        if (!this.selectedItem) return '';
        return this.selectedItem.owner.split(' ').map(n => n[0]).join('').toUpperCase();
    }

    get ownerRatingDisplay() {
        return this.selectedItem ? this.selectedItem.ownerRating.toFixed(1) : '';
    }

    get ownerSwapCount() {
        return this.selectedItem ? this.selectedItem.ownerSwapCount : 0;
    }

    get ownerRatingStars() {
        const rating = this.selectedItem ? this.selectedItem.ownerRating : 0;
        return [1, 2, 3, 4, 5].map(s => ({
            key  : `os-${s}`,
            fill : s <= Math.round(rating) ? '#f59e0b' : 'none'
        }));
    }

    get selectedItemOwnerReviews() {
        if (!this.selectedItem || !this.selectedItem.ownerReviews) return [];
        return this.selectedItem.ownerReviews.map((r, i) => ({
            key      : `rev-${i}`,
            author   : r.author,
            text     : r.text,
            date     : r.date,
            starItems: [1, 2, 3, 4, 5].map(s => ({ key: `rs-${i}-${s}`, fill: s <= r.stars ? '#f59e0b' : 'none' }))
        }));
    }

    get reviewsToggleLabel() {
        if (this.showOwnerReviews) return 'Masquer les avis';
        return `Voir les avis (${this.selectedItem ? this.selectedItem.ownerSwapCount : 0})`;
    }

    handleToggleOwnerReviews() { this.showOwnerReviews = !this.showOwnerReviews; }

    handleSelectItem(event) {
        const id = event.currentTarget.dataset.id;
        this.selectedItem     = MOCK_SWAP_ITEMS.find(item => item.id === id) || null;
        this.showPassport     = false;
        this.showOwnerReviews = false;
    }

    handleCloseSwapModal() {
        this.selectedItem = null;
        this.showPassport = false;
    }

    handleOverlayClick()      { this.handleCloseSwapModal(); }
    handleModalClick(event)   { event.stopPropagation(); }

    handleOfferChange(event)  { this.offeredItem = event.target.value; }

    handleSendRequest() {
        if (!this.selectedItem) return;
        const newReq = {
            id          : `REQ-${++this._reqCounter}`,
            item        : this.selectedItem,
            offeredItem : this.offeredItem,
            status      : 'pending',
            messages    : [
                { sender: 'System', text: `Swap request sent to ${this.selectedItem.owner}.`, time: 'Just now' }
            ]
        };
        this.requests     = [newReq, ...this.requests];
        this.selectedItem = null;
    }

    /* ── Passport ── */

    handleShowPassport() { this.showPassport = true;  }
    handleHidePassport() { this.showPassport = false; }

    /* ── Request list ── */

    get hasRequests()  { return this.requests.length > 0; }
    get requestCount() { return this.requests.length; }

    get requestItems() {
        const statusMap = {
            pending   : { label: 'PENDING',   cls: 'ns-status-badge ns-status-badge--warning' },
            accepted  : { label: 'ACCEPTED',  cls: 'ns-status-badge ns-status-badge--indigo'  },
            confirmed : { label: 'CONFIRMED', cls: 'ns-status-badge ns-status-badge--success' },
            completed : { label: 'COMPLETED', cls: 'ns-status-badge ns-status-badge--dark'    }
        };
        return this.requests.map(req => {
            const s = statusMap[req.status] || statusMap.pending;
            return {
                ...req,
                itemName       : req.item.name,
                itemImage      : req.item.image,
                statusLabel    : s.label,
                statusBadgeCls : s.cls,
                isPending      : req.status === 'pending',
                isAccepted     : req.status === 'accepted',
                isConfirmed    : req.status === 'confirmed',
                isCompleted    : req.status === 'completed'
            };
        });
    }

    _setStatus(id, newStatus) {
        this.requests = this.requests.map(r => r.id === id ? { ...r, status: newStatus } : r);
        if (this.activeRequest && this.activeRequest.id === id) {
            this.activeRequest = { ...this.activeRequest, status: newStatus };
        }
        if (newStatus === 'completed') { this.showReview = true; }
    }

    handleAccept(event)  { this._setStatus(event.currentTarget.dataset.id, 'accepted');  }
    handleConfirm(event) { this._setStatus(event.currentTarget.dataset.id, 'confirmed'); }
    handleComplete(event){ this._setStatus(event.currentTarget.dataset.id, 'completed'); }

    /* ── Chat ── */

    get isChatOpen()         { return !!this.activeRequest; }
    get activeRequestOwner() { return this.activeRequest ? this.activeRequest.item.owner : ''; }

    get messageItems() {
        if (!this.activeRequest) return [];
        return this.activeRequest.messages.map((msg, i) => ({
            key      : `msg-${i}`,
            sender   : msg.sender,
            text     : msg.text,
            time     : msg.time,
            wrapCls  : msg.sender === 'You' ? 'ns-msg ns-msg--right' : 'ns-msg ns-msg--left',
            bubbleCls: msg.sender === 'You' ? 'ns-bubble ns-bubble--dark' : 'ns-bubble ns-bubble--light'
        }));
    }

    handleOpenChat(event) {
        const id = event.currentTarget.dataset.id;
        this.activeRequest = this.requests.find(r => r.id === id) || null;
    }

    handleCloseChat()           { this.activeRequest = null; }
    handleMessageInput(event)   { this.messageInput = event.target.value; }
    handleMessageKeydown(event) { if (event.key === 'Enter') { this.handleSendMessage(); } }

    handleSendMessage() {
        if (!this.messageInput.trim() || !this.activeRequest) return;
        const newMsg  = { sender: 'You', text: this.messageInput, time: 'Just now' };
        const updated = { ...this.activeRequest, messages: [...this.activeRequest.messages, newMsg] };
        this.requests      = this.requests.map(r => r.id === updated.id ? updated : r);
        this.activeRequest = updated;
        this.messageInput  = '';

        const replyOwner = updated.item.owner;
        const replyId    = updated.id;
        clearTimeout(this._responseTimer);
        this._responseTimer = setTimeout(() => {
            const reply      = { sender: replyOwner, text: "That sounds like a fair trade. Let's do it!", time: '1m ago' };
            const withReply  = { ...updated, messages: [...updated.messages, reply] };
            this.requests = this.requests.map(r => r.id === replyId ? withReply : r);
            if (this.activeRequest && this.activeRequest.id === replyId) {
                this.activeRequest = withReply;
            }
        }, 2000);
    }

    /* ── Review ── */

    get starItems() {
        return [1, 2, 3, 4, 5].map(star => ({
            star,
            cls : star <= this.rating ? 'ns-star ns-star--active' : 'ns-star',
            fill: star <= this.rating ? '#f59e0b' : 'none'
        }));
    }

    handleSetRating(event) {
        this.rating = parseInt(event.currentTarget.dataset.star, 10);
    }

    handleSubmitReview() {
        this.showReview = false;
        this.rating     = 0;
    }
}
