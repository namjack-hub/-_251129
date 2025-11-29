
import React from 'react';
import { Book } from '../types';
import { Plus, ArrowRight, Trash2, RotateCcw } from 'lucide-react';

interface BookCardProps {
  book: Book;
  onAction: (book: Book, action: 'add' | 'approve' | 'remove' | 'return') => void;
}

const BookCard: React.FC<BookCardProps> = ({ book, onAction }) => {
  const currentStatus = book.status || 'discovery';

  // Determine actions based on status
  const renderActions = () => {
    switch (currentStatus) {
      case 'discovery':
        return (
          <button
            onClick={() => onAction(book, 'add')}
            className="flex h-10 w-10 md:h-8 md:w-8 shrink-0 items-center justify-center rounded-full bg-accent text-white shadow-lg transition-transform hover:bg-accent-dark active:scale-95"
            title="검토 목록에 추가"
          >
            <Plus size={20} className="md:w-[18px] md:h-[18px]" />
          </button>
        );
      case 'review':
        return (
          <div className="mt-2 md:mt-3 flex w-full gap-2">
             <button
              onClick={() => onAction(book, 'return')}
              className="flex-1 flex h-10 md:h-8 items-center justify-center gap-1 rounded-md border border-gray-200 bg-white text-sm font-medium text-gray-600 hover:bg-gray-50 active:bg-gray-100 dark:border-gray-600 dark:bg-slate-700 dark:text-gray-300"
              title="제외"
            >
              <RotateCcw size={16} className="md:w-3.5 md:h-3.5" /> <span className="md:text-xs">제외</span>
            </button>
            <button
              onClick={() => onAction(book, 'approve')}
              className="flex-1 flex h-10 md:h-8 items-center justify-center gap-1 rounded-md bg-green-600 text-sm font-medium text-white hover:bg-green-700 shadow-sm active:bg-green-800"
              title="확정"
            >
              <span className="md:text-xs">확정</span> <ArrowRight size={16} className="md:w-3.5 md:h-3.5" />
            </button>
          </div>
        );
      case 'confirmed':
        return (
          <button
            onClick={() => onAction(book, 'return')}
            className="flex h-10 w-10 md:h-7 md:w-7 items-center justify-center rounded-full bg-white/80 text-gray-500 hover:bg-red-100 hover:text-red-600 transition-colors shadow-sm backdrop-blur-sm border border-gray-100 dark:bg-slate-700 dark:border-gray-600 dark:text-gray-400"
            title="목록에서 제거"
          >
            <Trash2 size={18} className="md:w-3.5 md:h-3.5" />
          </button>
        );
    }
  };

  return (
    <div 
      className={`
        relative flex overflow-hidden rounded-xl border bg-white shadow-sm transition-all hover:shadow-md dark:bg-slate-800 dark:border-gray-700
        /* Mobile: Row Layout, Desktop: Column Layout */
        flex-row md:flex-col
        ${currentStatus === 'confirmed' ? 'border-green-200 dark:border-green-900/30 bg-green-50/30 dark:bg-green-900/10' : 'border-gray-100'}
        ${currentStatus === 'discovery' ? 'h-[120px] md:h-auto' : ''}
      `}
    >
      {/* Image Section */}
      <div className={`
        relative shrink-0 overflow-hidden bg-gray-100 shadow-inner
        /* Mobile: Fixed Width, Desktop: Auto Height */
        w-[80px] md:w-full md:aspect-[1/1.4]
      `}>
         {book.cover ? (
          <img 
            src={book.cover} 
            alt={book.title} 
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-[10px] text-gray-400">No Img</div>
        )}
      </div>

      {/* Content Section */}
      <div className="flex flex-1 flex-col justify-between p-3 min-w-0">
        <div>
          <div className="mb-1 flex items-center justify-between">
            <span className="text-[10px] font-bold text-accent dark:text-accent-light px-1.5 py-0.5 bg-amber-50 dark:bg-amber-900/30 rounded-full line-clamp-1 max-w-[80%]">
              {book.categoryName?.split('>').pop() || '기타'}
            </span>
            {/* Confirmed Delete Button Position for Mobile */}
            {currentStatus === 'confirmed' && (
              <div className="md:absolute md:top-2 md:right-2">
                {renderActions()}
              </div>
            )}
          </div>
          
          <h3 className="mb-1 line-clamp-2 text-sm font-bold leading-tight text-gray-900 dark:text-white" title={book.title}>
            {book.title}
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">
            {book.author}
          </p>
        </div>
        
        <div className="mt-2 flex items-end justify-between">
           <div className="text-sm font-bold text-gray-900 dark:text-gray-100">
            {book.priceSales.toLocaleString()}원
          </div>
          
          {/* Action Buttons */}
          {currentStatus !== 'confirmed' && (
             <div className={currentStatus === 'discovery' ? 'absolute bottom-3 right-3 md:static' : ''}>
               {renderActions()}
             </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookCard;
