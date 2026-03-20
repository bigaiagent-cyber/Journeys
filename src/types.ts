export interface InventoryItem {
  id: string;
  brand: string;
  codes: string;
  category: string;
}

export interface RackLocation {
  id: string;
  name: string;
  items: string[]; // Array of InventoryItem IDs
  type: 'wall' | 'stand' | 'section';
}

export interface StockRoomState {
  locations: Record<string, RackLocation>;
  items: Record<string, InventoryItem>;
}
