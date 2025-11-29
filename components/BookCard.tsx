
import React, { useState } from 'react';
import { Book } from '../types';
import { Plus, ArrowRight, Trash2, RotateCcw } from 'lucide-react';
import BookDetailModal from './BookDetailModal';

interface BookCardProps {
  book: Book;
  onAction: (book: Book, action: 'add' | 'approve' | 'remove' | 'return') => void;
}

const BookCard: React.FC<BookCardProps> = ({ book, onAction }) => {
  const currentStatus = book.status || 'discovery';
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Determine actions based on status
  const renderActions = () => {
    switch (currentStatus) {
      case 'discovery':
        return (
          <button
            onClick={(e) => {
              e.stopPropagation(); // Prevent opening modal
              onAction(book, 'add');
            }}
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
              onClick={(e) => {
                e.stopPropagation();
                onAction(book, 'return');
              }}
              className="flex-1 flex h-10 md:h-8 items-center justify-center gap-1 rounded-md border border-gray-200 bg-white text-sm font-medium text-gray-600 hover:bg-gray-50 active:bg-gray-100 dark:border-gray-600 dark:bg-slate-700 dark:text-gray-300"
              title="제외"
            >
              <RotateCcw size={16} className="md:w-3.5 md:h-3.5" /> <span className="md:text-xs">제외</span>
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAction(book, 'approve');
              }}
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
            onClick={(e) => {
              e.stopPropagation();
              onAction(book, 'return');
            }}
            className="flex h-10 w-10 md:h-7 md:w-7 items-center justify-center rounded-full bg-white/80 text-gray-500 hover:bg-red-100 hover:text-red-600 transition-colors shadow-sm backdrop-blur-sm border border-gray-100 dark:bg-slate-700 dark:border-gray-600 dark:text-gray-400"
            title="목록에서 제거"
          >
            <Trash2 size={18} className="md:w-3.5 md:h-3.5" />
          </button>
        );
    }
  };

  return (
    <>
      <div 
        onClick={() => setIsDetailOpen(true)}
        className={`
          relative flex overflow-hidden rounded-xl border bg-white shadow-sm transition-all hover:shadow-md dark:bg-slate-800 dark:border-gray-700 cursor-pointer
          
          /* Mobile: Row Layout (unchanged) */
          flex-row 
          
          /* Desktop: Grid Column Layout (Modified) */
          md:flex-col md:items-center md:max-w-[200px] md:p-4 md:text-center md:mx-auto md:w-full
          
          ${currentStatus === 'confirmed' ? 'border-green-200 dark:border-green-900/30 bg-green-50/30 dark:bg-green-900/10' : 'border-gray-100'}
          ${currentStatus === 'discovery' ? 'h-[120px] md:h-auto' : ''}
        `}
      >
        {/* Image Section */}
        <div className={`
          relative shrink-0 overflow-hidden bg-gray-100 shadow-inner
          /* Mobile: Fixed Width */
          w-[80px] 
          /* Desktop: Fixed Dimensions as requested */
          md:w-[140px] md:h-[200px] md:mb-3 md:rounded-lg md:shadow-md
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
        <div className="flex flex-1 flex-col justify-between p-3 min-w-0 md:p-0 md:w-full">
          <div className="md:flex md:flex-col md:items-center">
            <div className="mb-1 flex items-center justify-between md:justify-center md:w-full">
              <span className="text-[10px] font-bold text-accent dark:text-accent-light px-1.5 py-0.5 bg-amber-50 dark:bg-amber-900/30 rounded-full line-clamp-1 max-w-[80%] md:mb-1">
                {book.categoryName?.split('>').pop() || '기타'}
              </span>
              
              {/* Confirmed Delete Button for Mobile/Desktop Overlay */}
              {currentStatus === 'confirmed' && (
                <div className="md:absolute md:top-2 md:right-2">
                  {renderActions()}
                </div>
              )}
            </div>
            
            <h3 
              className="mb-1 text-sm font-bold leading-tight text-gray-900 dark:text-white line-clamp-2 md:h-[2.5em] md:overflow-hidden" 
              title={book.title}
            >
              {book.title}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">
              {book.author}
            </p>
          </div>
          
          <div className="mt-2 flex items-end justify-between md:flex-col md:items-center md:mt-3 md:gap-2">
            <div className="text-sm font-bold text-gray-900 dark:text-gray-100 md:text-base">
              {book.priceSales.toLocaleString()}원
            </div>
            
            {/* Action Buttons */}
            {currentStatus !== 'confirmed' && (
              <div className={currentStatus === 'discovery' ? 'absolute bottom-3 right-3 md:static' : 'w-full'}>
                {renderActions()}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Book Detail Modal */}
      <BookDetailModal 
        book={book} 
        isOpen={isDetailOpen} 
        onClose={() => setIsDetailOpen(false)}
        onAdd={(b) => onAction(b, 'add')}
      />
    </>
  );
};

export default BookCard;
