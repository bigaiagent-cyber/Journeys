import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { InventoryItem } from '../types';
import { GripVertical } from 'lucide-react';

interface Props {
  item: InventoryItem;
  isHighlighted?: boolean;
}

export const ItemCard: React.FC<Props> = ({ item, isHighlighted }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`
        group relative flex items-center gap-2 p-2 rounded-lg border text-xs transition-all
        ${isHighlighted 
          ? 'bg-orange-100 border-orange-400 shadow-md scale-105 z-10' 
          : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-sm'}
      `}
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing p-2 sm:p-1 hover:bg-slate-100 rounded text-slate-400 touch-none"
      >
        <GripVertical size={18} className="sm:w-3.5 sm:h-3.5" />
      </button>
      
      <div className="flex-1 min-w-0">
        <div className="font-bold text-slate-900 leading-tight">{item.brand}</div>
        <div className="text-slate-500 text-[10px] leading-tight break-words">{item.codes}</div>
      </div>

      <div className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-mono text-[9px]">
        {item.category}
      </div>
    </div>
  );
}
