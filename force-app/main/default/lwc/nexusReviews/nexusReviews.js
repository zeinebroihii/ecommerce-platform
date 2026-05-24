import { LightningElement, track, wire } from "lwc";
import getCombinedTestimonials from "@salesforce/apex/TestimonialController.getCombinedTestimonials";

const FALLBACK = [
  {
    testimonialId: "f1",
    initials: "AM",
    customerName: "Ahmed Mansouri",
    role: "CEO, Atlas Tech Solutions",
    message:
      "Nexus has completely transformed our B2B procurement process. The client portal is seamless, quotes are signed within minutes, and the visibility over our orders is exceptional.",
    rating: 5,
    avatarColor: "emerald"
  },
  {
    testimonialId: "f2",
    initials: "SD",
    customerName: "Sophie Durand",
    role: "Head of Procurement, Groupe Meridian",
    message:
      "The integrated e-signature and contract management reduced our sales cycle from 3 weeks to 48 hours. A remarkable productivity gain for our entire team.",
    rating: 5,
    avatarColor: "rose"
  },
  {
    testimonialId: "f3",
    initials: "CV",
    customerName: "Carlos Vega",
    role: "Head of Operations, TechVision Europe",
    message:
      "The real-time order tracking and inventory intelligence features are outstanding. Our supply chain visibility has never been this good — Nexus is now our operational backbone.",
    rating: 5,
    avatarColor: "indigo"
  },
  {
    testimonialId: "f4",
    initials: "NB",
    customerName: "Nadia Benali",
    role: "Chief Information Officer, Pharma Maghreb",
    message:
      "AI lead scoring and the CRM dashboard let us prioritize prospects with impressive accuracy. Our conversion rate has increased by 40% since adopting Nexus.",
    rating: 5,
    avatarColor: "amber"
  },
  {
    testimonialId: "f5",
    initials: "TM",
    customerName: "Thomas Müller",
    role: "CFO, NordEurope Supply GmbH",
    message:
      "Transparency and control over our procurement budget have improved dramatically. The escrow payment system and automated invoicing give us full confidence in every transaction.",
    rating: 5,
    avatarColor: "emerald"
  },
  {
    testimonialId: "f6",
    initials: "LH",
    customerName: "Leila Hamdani",
    role: "Head of Partnerships, Méditerrée Industries",
    message:
      "Onboarding is fast, support is responsive, and the platform keeps evolving. Nexus is far more than a tool — it is a true digital growth partner.",
    rating: 5,
    avatarColor: "indigo"
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
