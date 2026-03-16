import { LightningElement } from 'lwc';

const CATEGORIES = [
    {
        id: 'cat-1',
        title: 'PC Systems',
        num: '01',
        code: '[NX-SEC-01]',
        subGridClass: 'ncs-subs ncs-subs-1col',
        subCategories: [
            {
                id: 'sub-1a',
                name: 'Desktop PC',
                image: 'https://images.unsplash.com/photo-1587831990711-23ca6441447b?auto=format&fit=crop&q=80&w=400',
                imgWrapClass: 'ncs-img-wrap ncs-img-wide',
            },
            {
                id: 'sub-1b',
                name: 'Laptops / Notebooks',
                image: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&q=80&w=400',
                imgWrapClass: 'ncs-img-wrap ncs-img-wide',
            },
        ],
    },
    {
        id: 'cat-2',
        title: 'Monitors & Peripherals',
        num: '02',
        code: '[NX-SEC-02]',
        subGridClass: 'ncs-subs ncs-subs-2col',
        subCategories: [
            {
                id: 'sub-2a',
                name: 'Monitors',
                image: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&q=80&w=400',
                imgWrapClass: 'ncs-img-wrap ncs-img-square',
            },
            {
                id: 'sub-2b',
                name: 'Keyboards & Mice',
                image: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&q=80&w=400',
                imgWrapClass: 'ncs-img-wrap ncs-img-square',
            },
            {
                id: 'sub-2c',
                name: 'Headsets & Speakers',
                image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&q=80&w=400',
                imgWrapClass: 'ncs-img-wrap ncs-img-square',
            },
            {
                id: 'sub-2d',
                name: 'Hard Drive',
                image: 'https://images.unsplash.com/photo-1597484661643-2f5fef640dd1?auto=format&fit=crop&q=80&w=400',
                imgWrapClass: 'ncs-img-wrap ncs-img-square',
            },
        ],
    },
    {
        id: 'cat-3',
        title: 'Core Components',
        num: '03',
        code: '[NX-SEC-03]',
        subGridClass: 'ncs-subs ncs-subs-2col',
        subCategories: [
            {
                id: 'sub-3a',
                name: 'CPU',
                image: 'https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?auto=format&fit=crop&q=80&w=400',
                imgWrapClass: 'ncs-img-wrap ncs-img-square',
            },
            {
                id: 'sub-3b',
                name: 'Graphics Card',
                image: 'https://images.unsplash.com/photo-1591488320449-011701bb6704?auto=format&fit=crop&q=80&w=400',
                imgWrapClass: 'ncs-img-wrap ncs-img-square',
            },
            {
                id: 'sub-3c',
                name: 'PC Cases',
                image: 'https://images.unsplash.com/photo-1547082299-de196ea013d6?auto=format&fit=crop&q=80&w=400',
                imgWrapClass: 'ncs-img-wrap ncs-img-square',
            },
            {
                id: 'sub-3d',
                name: 'Motherboards',
                image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=400',
                imgWrapClass: 'ncs-img-wrap ncs-img-square',
            },
        ],
    },
    {
        id: 'cat-4',
        title: 'Networking & Servers',
        num: '04',
        code: '[NX-SEC-04]',
        subGridClass: 'ncs-subs ncs-subs-1col',
        subCategories: [
            {
                id: 'sub-4a',
                name: 'Wi-Fi & Networking',
                image: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&q=80&w=400',
                imgWrapClass: 'ncs-img-wrap ncs-img-wide',
            },
            {
                id: 'sub-4b',
                name: 'Servers & Workstations',
                image: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&q=80&w=400',
                imgWrapClass: 'ncs-img-wrap ncs-img-wide',
            },
        ],
    },
];

export default class NexusCategoriesSection extends LightningElement {
    categories = CATEGORIES;
}
