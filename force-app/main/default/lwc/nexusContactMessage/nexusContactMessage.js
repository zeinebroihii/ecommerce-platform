import { LightningElement, api, track } from 'lwc';

/**
 * nexusContactMessage — chat modal for messaging a contact.
 * Rendered conditionally by the parent (if:true).
 *
 * Fires:  close — bubbles, no detail
 */
export default class NexusContactMessage extends LightningElement {
    @api contactId   = '';
    @api contactName = '';
    @api initials    = '';

    @track newMessage = '';
    @track messages = [
        {
            id: 1,
            sender: 'bot',
            text: 'Bonjour\u00a0! Comment puis-je vous aider avec ce contact\u00a0?',
            wrapClass:   'ncm-msg-wrap ncm-msg-wrap--bot',
            bubbleClass: 'ncm-bubble ncm-bubble--bot'
        }
    ];

    _nextId = 2;

    handleClose() {
        this.dispatchEvent(new CustomEvent('close', { bubbles: true }));
    }

    handleOverlayClick() { this.handleClose(); }

    stopPropagation(event) { event.stopPropagation(); }

    handleInput(event) {
        this.newMessage = event.target.value;
    }

    handleKeyUp(event) {
        if (event.key === 'Enter') this.handleSend();
    }

    handleSend() {
        const text = (this.newMessage || '').trim();
        if (!text) return;
        this.messages = [
            ...this.messages,
            {
                id:          this._nextId++,
                sender:      'user',
                text,
                wrapClass:   'ncm-msg-wrap ncm-msg-wrap--user',
                bubbleClass: 'ncm-bubble ncm-bubble--user'
            }
        ];
        this.newMessage = '';
        // Clear the input field
        const input = this.template.querySelector('.ncm-input');
        if (input) input.value = '';
    }
}
