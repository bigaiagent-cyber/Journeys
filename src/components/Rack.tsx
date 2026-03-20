import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { 
  SortableContext, 
  verticalListSortingStrategy,
  rectSortingStrategy 
} from '@dnd-kit/sortable';
import { Plus } from 'lucide-react';
import { RackLocation, InventoryItem } from '../types';
import { ItemCard } from './ItemCard';

interface Props {
  location: RackLocation;
  items: InventoryItem[];
  highlightedItemId?: string | null;
  columns?: number;
  onAddItem?: (locationId: string) => void;
}

export const Rack: React.FC<Props> = ({ location, items, highlightedItemId, columns = 1, onAddItem }) => {
  const { setNodeRef } = useDroppable({
    id: location.id,
  });

  return (
    <div
      ref={setNodeRef}
      className={`
        flex flex-col gap-2 p-2 sm:p-3 rounded-xl border-2 transition-colors min-h-[80px] sm:min-h-[100px] h-full group
        ${location.type === 'wall' ? 'bg-slate-50 border-slate-200' : 'bg-blue-50/30 border-blue-100'}
      `}
    >
      <div className="flex items-center justify-between mb-0.5 sm:mb-1">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <h3 className="text-[9px] sm:text-[11px] font-black uppercase tracking-wider text-slate-500 truncate max-w-[80px] sm:max-w-none">
            {location.name}
          </h3>
          {onAddItem && (
            <button
              onClick={() => onAddItem(location.id)}
              className="p-1 rounded-full bg-white border border-slate-200 text-slate-400 hover:text-indigo-600 hover:border-indigo-200 hover:shadow-sm transition-all opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
              title="Add new entry"
            >
              <Plus size={10} strokeWidth={3} />
            </button>
          )}
        </div>
        <span className="text-[8px] sm:text-[10px] text-slate-400 font-bold uppercase">
          {items.length}
        </span>
      </div>

      <div 
        className={`grid gap-2 flex-1`}
        style={{ 
          gridTemplateColumns: columns > 1 ? `repeat(${columns}, minmax(0, 1fr))` : '1fr' 
        }}
      >
        <SortableContext 
          items={items.map(i => i.id)} 
          strategy={columns > 1 ? rectSortingStrategy : verticalListSortingStrategy}
        >
          {items.map((item) => (
            <ItemCard 
              key={item.id} 
              item={item} 
              isHighlighted={item.id === highlightedItemId}
            />
          ))}
        </SortableContext>
      </div>
    </div>
  );
}
