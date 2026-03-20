import { InventoryItem, RackLocation } from './types';

export const INITIAL_ITEMS: InventoryItem[] = [
  // Wall 1
  { id: 'dc-1', brand: 'DC Shoes', codes: '352155 & 352306', category: '35' },
  { id: 'toms-1', brand: 'TOMS', codes: '350698', category: '35' },
  { id: 'clarks-1', brand: 'Clarks', codes: '296395 & 125063', category: '29' },
  { id: 'puma-1', brand: 'Puma', codes: '362223 & 362324', category: '36' },
  { id: 'asics-1', brand: 'Asics', codes: '397414 to 397454', category: '397' },
  { id: 'conv-1', brand: 'Converse', codes: '389390 to 389493', category: '389' },

  // Wall 2
  { id: 'conv-2', brand: 'Converse', codes: '389552 to 399850', category: '389' },
  { id: 'nb-1', brand: 'New Balance', codes: '401875 to 402031', category: '40' },
  { id: 'nb-2', brand: 'NB', codes: '402049 to 402127', category: '40' },
  { id: 'nb-3', brand: 'NB', codes: '402170 to 402230', category: '40' },
  { id: 'nb-4', brand: 'NB', codes: '402234 to 402236 (Fire Exit Rack)', category: '40' },
  { id: 'nb-5', brand: 'NB', codes: '402248 to 402249', category: '40' },

  // Stand 1
  { id: 'adidas-1', brand: 'Adidas', codes: '437299 to 437575', category: '437' },

  // Stand 2
  { id: 'adidas-2', brand: 'Adidas', codes: '436689 to 437789', category: '437' },
  { id: 'saucony-1', brand: 'Saucony', codes: '489200 to 489223 (Low: 489182)', category: '48' },
  { id: 'reebok-1', brand: 'Reebok', codes: '480990 to 481000 (Top)', category: '48' },
  { id: 'reebok-2', brand: 'Reebok', codes: '481113 (Low)', category: '48' },
  { id: 'vans-1', brand: 'Vans', codes: '497483 to 497973', category: '496' },
  { id: 'crocs-1', brand: 'Crocs', codes: '521066 (Top)', category: '52' },

  // Stand 3
  { id: 'crocs-2', brand: 'Crocs', codes: '521508 to 521577', category: '52' },
  { id: 'timberland-1', brand: 'Timberland', codes: '530061 to 539849', category: '53' },
  { id: 'drmartens-1', brand: 'Dr Martens', codes: '569093 to 579317', category: '57' },
  { id: 'uggs-1', brand: 'Uggs', codes: '581406 to 581636', category: '58' },

  // Stand 4
  { id: 'uggs-2', brand: 'Uggs', codes: '581636 & 581928 to 582254', category: '58' },
  { id: 'uggs-3', brand: 'Uggs (Opposite)', codes: '582255 to 582280', category: '58' },
  { id: 'columbia-1', brand: 'Columbia', codes: '631013 to 757201', category: '63' },
  { id: 'sorel-1', brand: 'Sorel', codes: '630982 to 638219', category: '63' },
  { id: 'northface-1', brand: 'North Face', codes: '780191 to 780203', category: '78' },
  { id: 'kamik-1', brand: 'Kamik', codes: '801072 to 801130', category: '80' },
  { id: 'godik-1', brand: 'Godik', codes: '801063 (Last 1)', category: '80' },
  { id: 'heydude-1', brand: 'Hey Dude', codes: '802555 to 802571', category: '80' },
  { id: 'birkenstock-1', brand: 'Birkenstock', codes: '850106 to 850821', category: '85' },

  // Stand 5
  { id: 'birkenstock-2', brand: 'Birkenstock', codes: '850839 to 850989', category: '85' },
  { id: 'uggs-4', brand: 'Uggs', codes: '896278 to 896955', category: '89' },

  // Kids/Toddlers
  { id: 'conv-kids', brand: 'Converse (Youth)', codes: '1398170 to 1398734', category: 'Kids' },
  { id: 'nb-kids', brand: 'New Balance (Youth)', codes: '1401861 to 1401948', category: 'Kids' },
];

export const INITIAL_LOCATIONS: Record<string, RackLocation> = {
  'wall-1': {
    id: 'wall-1',
    name: 'Wall 1 (Entry)',
    type: 'wall',
    items: ['dc-1', 'toms-1', 'clarks-1', 'puma-1', 'asics-1', 'conv-1'],
  },
  'wall-2': {
    id: 'wall-2',
    name: 'Wall 2 (Left)',
    type: 'wall',
    items: ['nb-5', 'nb-4', 'nb-3', 'nb-2', 'nb-1', 'conv-2'],
  },
  'stand-1': {
    id: 'stand-1',
    name: 'Stand 1',
    type: 'stand',
    items: ['adidas-1'],
  },
  'stand-2': {
    id: 'stand-2',
    name: 'Stand 2',
    type: 'stand',
    items: ['crocs-1', 'vans-1', 'reebok-2', 'reebok-1', 'saucony-1', 'adidas-2'],
  },
  'stand-3': {
    id: 'stand-3',
    name: 'Stand 3',
    type: 'stand',
    items: ['uggs-1', 'drmartens-1', 'timberland-1', 'crocs-2'],
  },
  'stand-4': {
    id: 'stand-4',
    name: 'Stand 4',
    type: 'stand',
    items: ['birkenstock-1', 'heydude-1', 'godik-1', 'kamik-1', 'northface-1', 'sorel-1', 'columbia-1', 'uggs-3', 'uggs-2'],
  },
  'stand-5': {
    id: 'stand-5',
    name: 'Stand 5',
    type: 'stand',
    items: ['uggs-4', 'birkenstock-2'],
  },
  'kids-section': {
    id: 'kids-section',
    name: 'Kids Section',
    type: 'section',
    items: ['nb-kids', 'conv-kids'],
  },
  'toddlers': {
    id: 'toddlers',
    name: 'Toddlers',
    type: 'section',
    items: [],
  },
  'quick-grabs': {
    id: 'quick-grabs',
    name: 'Quick Grabs',
    type: 'section',
    items: [],
  },
};
