import { LightningElement, track } from "lwc";

const FAQ_DATA = [
  {
    id: "general",
    label: "General",
    items: [
      {
        question: "What is Nexus Ecosystem?",
        answer:
          "Nexus is a unified CRM platform that combines IoT product sales, expert services, and advanced artificial intelligence to optimize your B2B and B2C operations."
      },
      {
        question: "How does Nexus handle data security?",
        answer:
          "Nexus uses end-to-end encryption and a decentralized architecture to ensure your sensitive data remains confidential and protected."
      }
    ]
  },
  {
    id: "tech",
    label: "Technical",
    items: [
      {
        question: "Can I integrate Nexus with my current tools?",
        answer:
          "Yes, Nexus has a robust API and native connectors for major ERPs, logistics tools, and payment platforms."
      },
      {
        question: "What is the average deployment time?",
        answer:
          "A standard deployment takes 2 to 4 weeks, including data migration, portal customization, and team training."
      }
    ]
  },
  {
    id: "business",
    label: "Business",
    items: [
      {
        question: "Is Nexus suitable for small businesses?",
        answer:
          "Absolutely. Nexus is a modular platform that scales with you. Start with the essentials and expand as you grow."
      },
      {
        question: "What are the benefits of the B2B profile?",
        answer:
          "The B2B profile offers volume discounts, automated quote management via Salesforce Flow, and access to the War Room for rare items."
      }
    ]
  }
];

export default class NexusFAQ extends LightningElement {
  @track activeCategory = "general";
  @track openIndex = 0;

  get categoryItems() {
    return FAQ_DATA.map((c) => ({
      id: c.id,
      label: c.label,
      btnClass:
        c.id === this.activeCategory
          ? "nfq-cat-btn nfq-cat-btn--active"
          : "nfq-cat-btn"
    }));
  }

  get currentItems() {
    const cat = FAQ_DATA.find((c) => c.id === this.activeCategory);
    return (cat ? cat.items : []).map((item, idx) => ({
      idx,
      question: item.question,
      answer: item.answer,
      isOpen: this.openIndex === idx,
      itemClass:
        this.openIndex === idx ? "nfq-item nfq-item--open" : "nfq-item",
      questionClass:
        this.openIndex === idx
          ? "nfq-question nfq-question--open"
          : "nfq-question",
      toggleClass:
        this.openIndex === idx ? "nfq-toggle nfq-toggle--open" : "nfq-toggle"
    }));
  }

  handleCategoryClick(event) {
    this.activeCategory = event.currentTarget.dataset.id;
    this.openIndex = null;
  }

  handleToggle(event) {
    const idx = parseInt(event.currentTarget.dataset.idx, 10);
    this.openIndex = this.openIndex === idx ? null : idx;
  }

  handleRequestQuote() {
    window.dispatchEvent(new CustomEvent("nexusscrolltoleadform"));
  }
}
