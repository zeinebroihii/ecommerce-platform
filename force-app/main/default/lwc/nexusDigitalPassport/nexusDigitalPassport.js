import { LightningElement, track } from 'lwc';

const MOCK_ASSETS = [
    {
        id: 'ASSET-001',
        name: 'Nexus Hub v2 (Enterprise Edition)',
        serialNumber: 'NX-8829-V2-B',
        mintDate: 'Jan 12, 2024',
        status: 'Active',
        blockchainId: '0x71C...92A1',
        image: 'https://picsum.photos/seed/hub/400/400',
        specs: [
            { label: 'Firmware',           value: 'v4.2.1-stable' },
            { label: 'Hardware Revision',  value: 'Rev B' },
            { label: 'Security Chip',      value: 'Nexus-T2' },
        ],
        history: [
            { date: 'Jan 12, 2024', event: 'Asset Minted at Nexus Factory (Lyon, FR)', hash: '0x123...abc' },
            { date: 'Jan 15, 2024', event: 'Quality Assurance Passed',                 hash: '0x456...def' },
            { date: 'Jan 20, 2024', event: 'Ownership Transferred to Current User',    hash: '0x789...ghi' },
        ],
    },
    {
        id: 'ASSET-002',
        name: 'Smart Sensor Node X-1',
        serialNumber: 'SN-1102-X1',
        mintDate: 'Feb 05, 2024',
        status: 'Active',
        blockchainId: '0x92B...44F2',
        image: 'https://picsum.photos/seed/sensor/400/400',
        specs: [
            { label: 'Sensor Type',       value: 'Multi-Spectral' },
            { label: 'Battery Health',    value: '98%' },
            { label: 'Last Calibration',  value: 'Feb 10, 2024' },
        ],
        history: [
            { date: 'Feb 05, 2024', event: 'Asset Minted',                  hash: '0xabc...123' },
            { date: 'Feb 10, 2024', event: 'Initial Calibration & Sync',    hash: '0xdef...456' },
        ],
    },
];

export default class NexusDigitalPassport extends LightningElement {

    @track selectedAssetId = null;

    /* ── Computed: list ── */

    get assetItems() {
        return MOCK_ASSETS.map(a => {
            const isSelected = a.id === this.selectedAssetId;
            return {
                ...a,
                cls: isSelected
                    ? 'ndp-asset-card ndp-asset-card--selected'
                    : 'ndp-asset-card',
                nameCls: isSelected
                    ? 'ndp-asset-name ndp-asset-name--selected'
                    : 'ndp-asset-name',
                serialCls: isSelected
                    ? 'ndp-asset-serial ndp-asset-serial--selected'
                    : 'ndp-asset-serial',
                chevronCls: isSelected
                    ? 'ndp-chevron ndp-chevron--selected'
                    : 'ndp-chevron',
            };
        });
    }

    /* ── Computed: passport ── */

    get hasSelected()        { return !!this.selectedAssetId; }

    get _selectedAsset() {
        return MOCK_ASSETS.find(a => a.id === this.selectedAssetId) || null;
    }

    get selectedName()       { return this._selectedAsset ? this._selectedAsset.name        : ''; }
    get selectedSerial()     { return this._selectedAsset ? this._selectedAsset.serialNumber : ''; }
    get selectedBlockchain() { return this._selectedAsset ? this._selectedAsset.blockchainId : ''; }
    get selectedMintDate()   { return this._selectedAsset ? this._selectedAsset.mintDate      : ''; }
    get selectedSpecs()      { return this._selectedAsset ? this._selectedAsset.specs         : []; }
    get selectedHistory()    { return this._selectedAsset ? this._selectedAsset.history       : []; }

    /* ── Handlers ── */

    handleSelectAsset(event) {
        this.selectedAssetId = event.currentTarget.dataset.id;
    }
}
