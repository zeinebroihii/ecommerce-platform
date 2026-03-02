import { LightningElement, api } from 'lwc';

const AI_MESSAGES = {
    High:   'Customer sentiment analysis indicates high frustration. AI recommends immediate escalation and a technical deep-dive within 24 hours.',
    Medium: 'Moderate urgency detected. AI suggests a follow-up within 48 hours to prevent escalation.',
    Low:    'Routine inquiry. AI has drafted a standard response template for review.',
};

/**
 * nexusCaseCard — single support case card.
 *
 * Fires: viewhistory   { caseId }
 *        schedulemeeting { caseId }
 */
export default class NexusCaseCard extends LightningElement {
    @api caseId       = '';
    @api caseNumber   = '';
    @api subject      = '';
    @api account      = '';
    @api contact      = '';
    @api status       = '';
    @api priority     = '';
    @api caseDate     = '';
    @api needsMeeting = false;

    get accentClass() {
        if (this.priority === 'High')   return 'ncc-accent ncc-accent--red';
        if (this.priority === 'Medium') return 'ncc-accent ncc-accent--amber';
        return 'ncc-accent ncc-accent--slate';
    }

    get priorityClass() {
        if (this.priority === 'High')   return 'ncc-priority-badge ncc-priority-badge--high';
        if (this.priority === 'Medium') return 'ncc-priority-badge ncc-priority-badge--medium';
        return 'ncc-priority-badge ncc-priority-badge--low';
    }

    get aiAnalysis() {
        return AI_MESSAGES[this.priority] || AI_MESSAGES.Low;
    }

    handleViewHistory() {
        this.dispatchEvent(new CustomEvent('viewhistory', {
            detail: { caseId: this.caseId }, bubbles: true
        }));
    }

    handleSchedule() {
        this.dispatchEvent(new CustomEvent('schedulemeeting', {
            detail: { caseId: this.caseId }, bubbles: true
        }));
    }
}
