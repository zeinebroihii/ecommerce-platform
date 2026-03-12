import { LightningElement, api } from 'lwc';

export default class Badge extends LightningElement {
    @api color = 'blue';

    get computedClass() {
        const base = 'px-2.5 py-0.5 rounded-full text-xs font-medium border ';
        const colors = {
            blue: 'bg-blue-50 text-blue-700 border-blue-100',
            green: 'bg-emerald-50 text-emerald-700 border-emerald-100',
            red: 'bg-rose-50 text-rose-700 border-rose-100'
        };
        return base + (colors[this.color] || colors.blue);
    }
}
