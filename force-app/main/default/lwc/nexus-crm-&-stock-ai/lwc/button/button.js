import { LightningElement, api } from 'lwc';

export default class Button extends LightningElement {
    @api variant = 'primary';

    get computedClass() {
        const base = 'px-4 py-2 rounded-lg font-medium transition-all ';
        const variants = {
            primary: 'bg-indigo-600 text-white hover:bg-indigo-700',
            secondary: 'bg-slate-100 text-slate-900 hover:bg-slate-200',
            outline: 'border border-slate-200 hover:bg-slate-50'
        };
        return base + (variants[this.variant] || variants.primary);
    }

    handleClick(event) {
        this.dispatchEvent(new CustomEvent('click', { detail: event }));
    }
}
