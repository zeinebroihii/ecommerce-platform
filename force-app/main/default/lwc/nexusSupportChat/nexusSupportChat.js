import { LightningElement, api, track } from "lwc";
import sendMessage from "@salesforce/apex/SupportChatController.sendMessage";

const BADGE_COLOR_MAP = {
  green: "nsc-badge nsc-badge--green",
  amber: "nsc-badge nsc-badge--amber",
  red: "nsc-badge nsc-badge--red",
  blue: "nsc-badge nsc-badge--blue"
};

const WELCOME_CHIPS = [
  "My orders",
  "My quotes",
  "Current deals",
  "Product search"
];

function nowTime() {
  return new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit"
  });
}

function uid() {
  return Math.random().toString(36).substr(2, 9);
}

function buildParagraphs(text) {
  if (!text) return [];
  return text
    .split("\n")
    .filter((l) => l.trim() !== "")
    .map((line) => ({
      id: uid(),
      text: line,
      cls:
        line.startsWith("•") || line.startsWith("-")
          ? "nsc-bubble-bullet"
          : "nsc-bubble-line"
    }));
}

function enrichCards(cards) {
  if (!cards) return [];
  return cards.map((c) => ({
    ...c,
    badgeCls: BADGE_COLOR_MAP[c.badgeColor] || "nsc-badge nsc-badge--blue"
  }));
}

export default class NexusSupportChat extends LightningElement {
  @api accountId;

  @track isOpen = false;
  @track isTyping = false;
  @track messages = [];
  @track inputValue = "";
  @track currentChips = WELCOME_CHIPS;
  @track hasUnread = false;
  @track unreadCount = 0;

  _greeted = false;

  // ── Open / close ──────────────────────────────────────────────────────────

  handleOpen() {
    this.isOpen = true;
    this.hasUnread = false;
    this.unreadCount = 0;
    if (!this._greeted) {
      this._greeted = true;
      // Show welcome instantly — no round-trip needed
      this._addMessage({
        text: "Hi! I'm Nexus AI, your intelligent support assistant. 👋\n\nI can help you with anything — your orders, quotes, product search, current deals, shipping, or any question about the Nexus portal.\n\nWhat can I do for you today?",
        isBot: true,
        chips: ["My orders", "My quotes", "Current deals", "Find products"]
      });
    }
    // eslint-disable-next-line @lwc/lwc/no-async-operation
    setTimeout(() => this._scrollToBottom(), 100);
  }

  handleClose() {
    this.isOpen = false;
  }

  handleClearChat() {
    this.messages = [];
    this._greeted = false;
    this.currentChips = WELCOME_CHIPS;
    // eslint-disable-next-line @lwc/lwc/no-async-operation
    setTimeout(() => this._sendBot("greeting"), 300);
  }

  // ── Input ─────────────────────────────────────────────────────────────────

  handleInput(event) {
    this.inputValue = event.target.value;
  }

  handleKeyDown(event) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      this.handleSend();
    }
  }

  handleChip(event) {
    const chip = event.currentTarget.dataset.chip;
    if (chip) this._submitMessage(chip);
  }

  handleSend() {
    const text = (this.inputValue || "").trim();
    if (!text) return;
    this.inputValue = "";
    this._submitMessage(text);
  }

  // ── Core flow ─────────────────────────────────────────────────────────────

  _submitMessage(text) {
    // Add user message
    this._addMessage({ text, isBot: false });
    // Show typing
    this.isTyping = true;
    this._scrollToBottom();

    sendMessage({ userMessage: text, accountId: this.accountId || "" })
      .then((resp) => {
        this.isTyping = false;
        this._addBotResponse(resp);
      })
      .catch(() => {
        this.isTyping = false;
        this._addMessage({
          text: "Something went wrong. Please try again in a moment.",
          isBot: true,
          chips: WELCOME_CHIPS
        });
      });
  }

  _sendBot(intent) {
    this.isTyping = true;
    sendMessage({ userMessage: intent, accountId: this.accountId || "" })
      .then((resp) => {
        this.isTyping = false;
        this._addBotResponse(resp);
      })
      .catch(() => {
        this.isTyping = false;
        this._addMessage({
          text: "Hi! I'm Nexus AI — your support assistant. How can I help you today?",
          isBot: true,
          chips: WELCOME_CHIPS
        });
      });
  }

  _addBotResponse(resp) {
    if (!resp) return;
    this._addMessage({
      text: resp.text || "",
      cards: resp.cards || [],
      chips: resp.chips || WELCOME_CHIPS,
      isBot: true
    });
  }

  _addMessage({ text, isBot, cards = [], chips = [] }) {
    const msg = {
      id: uid(),
      text,
      isBot,
      cards: enrichCards(cards),
      hasCards: cards && cards.length > 0,
      time: nowTime(),
      paragraphs: buildParagraphs(text),
      wrapClass: isBot
        ? "nsc-msg-wrap nsc-msg-wrap--bot"
        : "nsc-msg-wrap nsc-msg-wrap--user",
      bubbleClass: isBot
        ? "nsc-bubble nsc-bubble--bot"
        : "nsc-bubble nsc-bubble--user"
    };
    this.messages = [...this.messages, msg];

    if (chips && chips.length) {
      this.currentChips = chips;
    }

    if (!this.isOpen) {
      this.hasUnread = true;
      this.unreadCount = (this.unreadCount || 0) + 1;
    }

    // eslint-disable-next-line @lwc/lwc/no-async-operation
    setTimeout(() => this._scrollToBottom(), 60);
  }

  _scrollToBottom() {
    const container = this.template.querySelector('[data-id="messages"]');
    if (container) container.scrollTop = container.scrollHeight;
  }

  // ── Getters ───────────────────────────────────────────────────────────────

  get showChips() {
    return this.currentChips && this.currentChips.length > 0 && !this.isTyping;
  }
  get sendBtnClass() {
    return this.inputValue && this.inputValue.trim()
      ? "nsc-send nsc-send--active"
      : "nsc-send";
  }
}
