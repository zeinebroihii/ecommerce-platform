import { LightningElement, wire, track } from "lwc";
import { refreshApex } from "@salesforce/apex";
import { ShowToastEvent } from "lightning/platformShowToastEvent";
import getAvailableListings from "@salesforce/apex/SwapController.getAvailableListings";
import getMySentRequests from "@salesforce/apex/SwapController.getMySentRequests";
import getReceivedRequests from "@salesforce/apex/SwapController.getReceivedRequests";
import getMyListings from "@salesforce/apex/SwapController.getMyListings";
import sendSwapRequest from "@salesforce/apex/SwapController.sendSwapRequest";
import updateRequestStatus from "@salesforce/apex/SwapController.updateRequestStatus";
import sendMessageApex from "@salesforce/apex/SwapController.sendMessage";
import getMessagesApex from "@salesforce/apex/SwapController.getMessages";
import createListing from "@salesforce/apex/SwapController.createListing";
import cancelListing from "@salesforce/apex/SwapController.cancelListing";

const CATEGORIES = ["All", "Hardware", "IoT", "Connectivity", "Other"];

export default class NexusSwap extends LightningElement {
  @track activeCategory = "All";
  @track searchQuery = "";
  @track selectedItem = null;
  @track showPassport = false;
  @track showOwnerReviews = false;
  @track activeRequest = null;
  @track messageInput = "";
  @track showReview = false;
  @track rating = 0;
  @track offeredItem = "";

  // Listing form
  @track showListingForm = false;
  @track listingName = "";
  @track listingCondition = "Good";
  @track listingCategory = "Hardware";
  @track listingDescription = "";
  @track listingCo2 = "";
  @track _listingSaving = false;
  @track _cancellingId = null;

  // Chat
  @track _chatMessages = [];
  @track _chatLoading = false;

  // Wired result references (for refreshApex)
  _wiredListings;
  _wiredSentRequests;
  _wiredReceivedRequests;
  _wiredMyListings;

  // ── Wire adapters ────────────────────────────────────────────────────────

  @wire(getAvailableListings, {
    category: "$activeCategory",
    searchQuery: "$searchQuery"
  })
  wiredListings(result) {
    this._wiredListings = result;
  }

  @wire(getMySentRequests)
  wiredSentRequests(result) {
    this._wiredSentRequests = result;
  }

  @wire(getReceivedRequests)
  wiredReceivedRequests(result) {
    this._wiredReceivedRequests = result;
  }

  @wire(getMyListings)
  wiredMyListings(result) {
    this._wiredMyListings = result;
  }

  // ── Category / Search ────────────────────────────────────────────────────

  get categoryFilters() {
    return CATEGORIES.map((cat) => ({
      id: cat,
      label: cat,
      cls: cat === this.activeCategory ? "ns-pill ns-pill--active" : "ns-pill"
    }));
  }

  get filteredItems() {
    const data = this._wiredListings && this._wiredListings.data;
    if (!data) return [];
    return data.map((item) => ({
      id: item.Id,
      name: item.Name,
      image:
        item.Image_URL__c ||
        "https://picsum.photos/seed/" + item.Id + "/400/400",
      owner: item.Owner_Contact__r ? item.Owner_Contact__r.Name : "Unknown",
      condition: item.Condition__c || "",
      category: item.Category__c || "",
      co2Saved: item.CO2_Saved__c || 0,
      verified: item.Is_Verified__c || false
    }));
  }

  get isLoadingListings() {
    return !!(
      this._wiredListings &&
      !this._wiredListings.data &&
      !this._wiredListings.error
    );
  }

  get isListingsEmpty() {
    return !this.isLoadingListings && this.filteredItems.length === 0;
  }

  handleCategoryChange(event) {
    this.activeCategory = event.currentTarget.dataset.category;
  }
  handleSearch(event) {
    this.searchQuery = event.target.value;
  }

  // ── My Listings ──────────────────────────────────────────────────────────

  get myListingSuggestions() {
    const data = this._wiredMyListings && this._wiredMyListings.data;
    if (!data || !data.length) return [];
    return data.map((l) => l.Name + " (" + l.Condition__c + ")");
  }

  get myListingItems() {
    const data = this._wiredMyListings && this._wiredMyListings.data;
    if (!data) return [];
    const statusMap = {
      Available: {
        label: "Available",
        cls: "ns-status-badge ns-status-badge--success"
      },
      Pending: {
        label: "Pending",
        cls: "ns-status-badge ns-status-badge--warning"
      },
      Completed: {
        label: "Completed",
        cls: "ns-status-badge ns-status-badge--dark"
      },
      Cancelled: {
        label: "Cancelled",
        cls: "ns-status-badge ns-status-badge--dark"
      }
    };
    return data
      .filter((l) => l.Status__c !== "Cancelled" && l.Status__c !== "Completed")
      .map((l) => {
        const s = statusMap[l.Status__c] || statusMap.Available;
        return {
          id: l.Id,
          name: l.Name,
          category: l.Category__c || "",
          condition: l.Condition__c || "",
          co2: l.CO2_Saved__c || 0,
          status: s.label,
          statusCls: s.cls,
          canCancel: l.Status__c === "Available",
          isCancelling: l.Id === this._cancellingId
        };
      });
  }

  get hasMyListings() {
    return this.myListingItems.length > 0;
  }
  get myListingCount() {
    return this.myListingItems.length;
  }

  handleCancelListing(event) {
    const id = event.currentTarget.dataset.id;
    this._cancellingId = id;
    cancelListing({ listingId: id })
      .then(() => {
        this._cancellingId = null;
        this._toast(
          "Listing removed",
          "Your item has been unlisted.",
          "success"
        );
        return refreshApex(this._wiredMyListings);
      })
      .catch((err) => {
        this._cancellingId = null;
        this._toast("Error", this._msg(err), "error");
      });
  }

  // ── Swap modal ───────────────────────────────────────────────────────────

  get isSwapModalOpen() {
    return !!this.selectedItem;
  }
  get selectedItemName() {
    return this.selectedItem ? this.selectedItem.name : "";
  }
  get selectedItemImage() {
    return this.selectedItem ? this.selectedItem.image : "";
  }
  get selectedItemCategory() {
    return this.selectedItem ? this.selectedItem.category : "";
  }
  get selectedItemCondition() {
    return this.selectedItem ? this.selectedItem.condition : "";
  }
  get selectedItemCo2() {
    return this.selectedItem ? this.selectedItem.co2Saved : 0;
  }
  get selectedItemId() {
    return this.selectedItem ? this.selectedItem.id : "";
  }
  get selectedItemOwner() {
    return this.selectedItem ? this.selectedItem.owner : "";
  }

  get selectedItemIsNewSwapper() {
    return true;
  }

  get ownerInitials() {
    if (!this.selectedItem) return "";
    return this.selectedItem.owner
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  }

  get ownerRatingDisplay() {
    return "—";
  }
  get ownerSwapCount() {
    return 0;
  }
  get ownerRatingStars() {
    return [1, 2, 3, 4, 5].map((s) => ({ key: "os-" + s, fill: "none" }));
  }
  get selectedItemOwnerReviews() {
    return [];
  }

  get reviewsToggleLabel() {
    return this.showOwnerReviews ? "Hide reviews" : "See reviews";
  }
  handleToggleOwnerReviews() {
    this.showOwnerReviews = !this.showOwnerReviews;
  }

  handleSelectItem(event) {
    const id = event.currentTarget.dataset.id;
    const data = (this._wiredListings && this._wiredListings.data) || [];
    const raw = data.find((i) => i.Id === id);
    if (!raw) return;
    this.selectedItem = {
      id: raw.Id,
      name: raw.Name,
      image:
        raw.Image_URL__c || "https://picsum.photos/seed/" + raw.Id + "/400/400",
      owner: raw.Owner_Contact__r ? raw.Owner_Contact__r.Name : "Unknown",
      condition: raw.Condition__c || "",
      category: raw.Category__c || "",
      co2Saved: raw.CO2_Saved__c || 0,
      verified: raw.Is_Verified__c || false,
      createdDate: raw.CreatedDate || null
    };
    this.showPassport = false;
    this.showOwnerReviews = false;
    this.offeredItem = "";
  }

  get selectedItemSealId() {
    if (!this.selectedItem) return "";
    return "SEAL-NX-" + this.selectedItem.id.substring(0, 8).toUpperCase();
  }

  get selectedItemTrustScore() {
    if (!this.selectedItem) return 0;
    return this.selectedItem.verified ? 94 : 72;
  }

  get sealTrustBarStyle() {
    return "width:" + this.selectedItemTrustScore + "%";
  }

  get selectedItemListedDate() {
    if (!this.selectedItem || !this.selectedItem.createdDate) return "—";
    try {
      return new Date(this.selectedItem.createdDate).toLocaleDateString(
        "en-GB",
        { day: "2-digit", month: "short", year: "numeric" }
      );
    } catch {
      return "—";
    }
  }

  get selectedItemListedShort() {
    if (!this.selectedItem || !this.selectedItem.createdDate) return "—";
    try {
      return new Date(this.selectedItem.createdDate).toLocaleDateString(
        "en-GB",
        { day: "2-digit", month: "short" }
      );
    } catch {
      return "—";
    }
  }

  handleCloseSwapModal() {
    this.selectedItem = null;
    this.showPassport = false;
  }
  handleOverlayClick() {
    this.handleCloseSwapModal();
  }
  handleModalClick(e) {
    e.stopPropagation();
  }
  handleOfferChange(e) {
    this.offeredItem = e.target.value;
  }

  handleSendRequest() {
    if (!this.selectedItem) return;
    if (!this.offeredItem.trim()) {
      this._toast(
        "Missing information",
        "Please describe what you are offering in exchange.",
        "warning"
      );
      return;
    }
    sendSwapRequest({
      listingId: this.selectedItem.id,
      offeredItem: this.offeredItem
    })
      .then(() => {
        this.selectedItem = null;
        this.offeredItem = "";
        this._toast(
          "Request sent!",
          "Your swap request has been sent. Wait for the owner to respond.",
          "success"
        );
        return refreshApex(this._wiredSentRequests);
      })
      .then(() => refreshApex(this._wiredListings))
      .catch((err) => this._toast("Error", this._msg(err), "error"));
  }

  // ── Passport (Nexus Seal Certificate) ────────────────────────────────────

  handleShowPassport() {
    this.showPassport = true;
  }
  handleHidePassport() {
    this.showPassport = false;
  }

  // ── Request list ─────────────────────────────────────────────────────────

  get _allRequests() {
    const sent =
      (this._wiredSentRequests && this._wiredSentRequests.data) || [];
    const received =
      (this._wiredReceivedRequests && this._wiredReceivedRequests.data) || [];
    const seen = new Set();
    return [...sent, ...received].filter((r) => {
      if (seen.has(r.Id)) return false;
      seen.add(r.Id);
      return true;
    });
  }

  get hasRequests() {
    return this.requestItems.length > 0;
  }
  get requestCount() {
    return this.requestItems.length;
  }

  get requestItems() {
    const statusMap = {
      Pending: {
        label: "PENDING",
        cls: "ns-status-badge ns-status-badge--warning"
      },
      Accepted: {
        label: "ACCEPTED",
        cls: "ns-status-badge ns-status-badge--indigo"
      },
      Confirmed: {
        label: "CONFIRMED",
        cls: "ns-status-badge ns-status-badge--success"
      },
      Completed: {
        label: "COMPLETED",
        cls: "ns-status-badge ns-status-badge--dark"
      },
      Cancelled: {
        label: "CANCELLED",
        cls: "ns-status-badge ns-status-badge--dark"
      }
    };
    return this._allRequests
      .filter((r) => r.Status__c !== "Cancelled" && r.Status__c !== "Completed")
      .map((req) => {
        const s = statusMap[req.Status__c] || statusMap.Pending;
        const name = req.Listing__r
          ? req.Listing__r.Name
          : req.Listing__c || "—";
        const img =
          req.Listing__r && req.Listing__r.Image_URL__c
            ? req.Listing__r.Image_URL__c
            : "https://picsum.photos/seed/" +
              (req.Listing__c || req.Id) +
              "/400/400";
        return {
          id: req.Id,
          itemName: name,
          itemImage: img,
          offeredItem: req.Offered_Item__c,
          statusLabel: s.label,
          statusBadgeCls: s.cls,
          isPending: req.Status__c === "Pending",
          isAccepted: req.Status__c === "Accepted",
          isConfirmed: req.Status__c === "Confirmed",
          isCompleted: req.Status__c === "Completed"
        };
      });
  }

  _updateStatus(id, newStatus) {
    updateRequestStatus({ requestId: id, newStatus })
      .then(() => {
        if (newStatus === "Completed") this.showReview = true;
        return Promise.all([
          refreshApex(this._wiredSentRequests),
          refreshApex(this._wiredReceivedRequests),
          refreshApex(this._wiredListings)
        ]);
      })
      .catch((err) => this._toast("Error", this._msg(err), "error"));
  }

  handleAccept(event) {
    this._updateStatus(event.currentTarget.dataset.id, "Accepted");
  }
  handleConfirm(event) {
    this._updateStatus(event.currentTarget.dataset.id, "Confirmed");
  }
  handleComplete(event) {
    this._updateStatus(event.currentTarget.dataset.id, "Completed");
  }

  // ── Chat ─────────────────────────────────────────────────────────────────

  get isChatOpen() {
    return !!this.activeRequest;
  }

  get activeRequestOwner() {
    if (!this.activeRequest) return "";
    if (
      this.activeRequest.Listing__r &&
      this.activeRequest.Listing__r.Owner_Contact__r
    ) {
      return this.activeRequest.Listing__r.Owner_Contact__r.Name;
    }
    if (this.activeRequest.Requester_Contact__r) {
      return this.activeRequest.Requester_Contact__r.Name;
    }
    return "Swap Partner";
  }

  get messageItems() {
    return this._chatMessages.map((msg, i) => {
      const isSystem = msg.Is_System_Message__c;
      const isMe = msg._isMe === true;
      return {
        key: "msg-" + i,
        sender: isSystem ? "System" : msg.Sender_Name__c,
        text: msg.Message__c,
        time: this._formatDate(msg.CreatedDate),
        wrapCls: isSystem
          ? "ns-msg ns-msg--system"
          : isMe
            ? "ns-msg ns-msg--right"
            : "ns-msg ns-msg--left",
        bubbleCls: isSystem
          ? "ns-bubble ns-bubble--system"
          : isMe
            ? "ns-bubble ns-bubble--dark"
            : "ns-bubble ns-bubble--light"
      };
    });
  }

  handleOpenChat(event) {
    const id = event.currentTarget.dataset.id;
    const req = this._allRequests.find((r) => r.Id === id);
    if (!req) return;
    this.activeRequest = req;
    this._chatMessages = [];
    this._chatLoading = true;
    getMessagesApex({ requestId: id })
      .then((msgs) => {
        this._chatMessages = msgs || [];
        this._chatLoading = false;
      })
      .catch(() => {
        this._chatLoading = false;
      });
  }

  handleCloseChat() {
    this.activeRequest = null;
    this._chatMessages = [];
  }
  handleMessageInput(event) {
    this.messageInput = event.target.value;
  }
  handleMessageKeydown(event) {
    if (event.key === "Enter") this.handleSendMessage();
  }

  handleSendMessage() {
    if (!this.messageInput.trim() || !this.activeRequest) return;
    const text = this.messageInput;
    this.messageInput = "";
    sendMessageApex({ requestId: this.activeRequest.Id, messageText: text })
      .then((msg) => {
        this._chatMessages = [...this._chatMessages, { ...msg, _isMe: true }];
      })
      .catch((err) => this._toast("Error", this._msg(err), "error"));
  }

  // ── Listing Form ─────────────────────────────────────────────────────────

  get isListingFormOpen() {
    return this.showListingForm;
  }
  get isSavingListing() {
    return this._listingSaving;
  }
  get listingBtnLabel() {
    return this._listingSaving ? "Publishing..." : "Publish Listing";
  }

  handleOpenListingForm() {
    this.showListingForm = true;
  }
  handleListingOverlayClick() {
    this.handleCloseListingForm();
  }
  handleListingModalClick(e) {
    e.stopPropagation();
  }
  handleCloseListingForm() {
    this.showListingForm = false;
    this._resetForm();
  }
  handleListingName(e) {
    this.listingName = e.target.value;
  }
  handleListingCondition(e) {
    this.listingCondition = e.target.value;
  }
  handleListingCategory(e) {
    this.listingCategory = e.target.value;
  }
  handleListingDescription(e) {
    this.listingDescription = e.target.value;
  }
  handleListingCo2(e) {
    this.listingCo2 = e.target.value;
  }

  _resetForm() {
    this.listingName = "";
    this.listingCondition = "Good";
    this.listingCategory = "Hardware";
    this.listingDescription = "";
    this.listingCo2 = "";
  }

  handleCreateListing() {
    if (!this.listingName.trim()) {
      this._toast("Missing field", "Please enter a product name.", "warning");
      return;
    }
    this._listingSaving = true;
    createListing({
      productName: this.listingName,
      condition: this.listingCondition,
      category: this.listingCategory,
      description: this.listingDescription,
      co2Saved: parseFloat(this.listingCo2) || 0
    })
      .then(() => {
        this._listingSaving = false;
        this.showListingForm = false;
        this._resetForm();
        this._toast(
          "Listed!",
          "Your item is now visible to the community.",
          "success"
        );
        return refreshApex(this._wiredMyListings);
      })
      .catch((err) => {
        this._listingSaving = false;
        this._toast("Error", this._msg(err), "error");
      });
  }

  // ── Review ───────────────────────────────────────────────────────────────

  get starItems() {
    return [1, 2, 3, 4, 5].map((star) => ({
      star,
      cls: star <= this.rating ? "ns-star ns-star--active" : "ns-star",
      fill: star <= this.rating ? "#f59e0b" : "none"
    }));
  }

  handleSetRating(event) {
    this.rating = parseInt(event.currentTarget.dataset.star, 10);
  }
  handleSubmitReview() {
    this.showReview = false;
    this.rating = 0;
  }

  // ── Helpers ──────────────────────────────────────────────────────────────

  _toast(title, message, variant) {
    this.dispatchEvent(new ShowToastEvent({ title, message, variant }));
  }

  _msg(err) {
    return (err && err.body && err.body.message) || "An error occurred.";
  }

  _formatDate(isoStr) {
    if (!isoStr) return "";
    try {
      return new Date(isoStr).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit"
      });
    } catch {
      return "";
    }
  }
}
