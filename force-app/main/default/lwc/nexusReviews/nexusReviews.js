import { LightningElement, track, wire } from "lwc";
import getCombinedTestimonials from "@salesforce/apex/TestimonialController.getCombinedTestimonials";

const FALLBACK = [
  {
    testimonialId: "f1",
    initials: "SJ",
    customerName: "Sarah Jenkins",
    role: "CTO, Global Logistics",
    message:
      "Nexus transformed our inventory management. The interface is intuitive and the predictive analytics are incredibly accurate.",
    rating: 5,
    avatarColor: "emerald"
  },
  {
    testimonialId: "f2",
    initials: "MD",
    customerName: "Marc Dupont",
    role: "Purchasing Director, EuroSystems",
    message:
      "The B2B portal is a game-changer. Our clients love the autonomy and transparency the platform provides.",
    rating: 5,
    avatarColor: "indigo"
  },
  {
    testimonialId: "f3",
    initials: "ER",
    customerName: "Elena Rodriguez",
    role: "Founder, TechFlow",
    message:
      "Exceptional customer support and seamless integration. Nexus has become the pillar of our digital growth.",
    rating: 5,
    avatarColor: "rose"
  }
];

const AVATAR_CLS = {
  emerald: "nr-avatar nr-avatar--emerald",
  indigo: "nr-avatar nr-avatar--indigo",
  rose: "nr-avatar nr-avatar--rose",
  amber: "nr-avatar nr-avatar--amber"
};

export default class NexusReviews extends LightningElement {
  @track _page = 0;
  @track _data = null; // null = loading; [] = loaded empty; [...] = real data

  @wire(getCombinedTestimonials)
  wiredTestimonials({ error, data }) {
    if (data) {
      this._data = data.length > 0 ? data : [];
      // eslint-disable-next-line no-console
      console.log(
        "[nexusReviews] loaded " + this._data.length + " testimonials"
      );
    } else if (error) {
      // eslint-disable-next-line no-console
      console.error(
        "[nexusReviews] Apex error status=" +
          (error.status || "?") +
          " msg=" +
          (error.body && error.body.message
            ? error.body.message
            : JSON.stringify(error))
      );
      this._data = [];
    }
  }

  // ── Source: real data if available, else fallback ─────────────────────────

  get _raw() {
    if (this._data && this._data.length > 0) return this._data;
    return FALLBACK;
  }

  get _cards() {
    return this._raw.map((r) => ({
      ...r,
      avatarCls: AVATAR_CLS[r.avatarColor] || "nr-avatar nr-avatar--emerald",
      stars: [1, 2, 3, 4, 5].map((v) => ({
        key: String(v),
        cls:
          v <= (r.rating || 5) ? "nr-star nr-star--on" : "nr-star nr-star--off"
      }))
    }));
  }

  get reviews() {
    const start = this._page * 3;
    return this._cards.slice(start, start + 3);
  }

  get totalPages() {
    return Math.max(1, Math.ceil(this._cards.length / 3));
  }

  get canPrev() {
    return this._page > 0;
  }
  get canNext() {
    return this._page < this.totalPages - 1;
  }

  get prevBtnCls() {
    return this.canPrev
      ? "nr-nav-btn nr-nav-btn--outline"
      : "nr-nav-btn nr-nav-btn--outline nr-nav-btn--disabled";
  }
  get nextBtnCls() {
    return this.canNext
      ? "nr-nav-btn nr-nav-btn--dark"
      : "nr-nav-btn nr-nav-btn--dark nr-nav-btn--disabled";
  }

  handlePrev() {
    if (this.canPrev) this._page -= 1;
  }
  handleNext() {
    if (this.canNext) this._page += 1;
  }
}
