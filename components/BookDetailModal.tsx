
import React, { useEffect } from 'react';
import { Book } from '../types';
import { X, ExternalLink, Calendar, BookOpen, Tag, CreditCard } from 'lucide-react';

interface BookDetailModalProps {
  book: Book;
  isOpen: boolean;
  onClose: () => void;
  onAdd: (book: Book) => void;
}

const BookDetailModal: React.FC<BookDetailModalProps> = ({ book, isOpen, onClose, onAdd }) => {
  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-fade-in-up">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/10 bg-white/5 backdrop-blur-md sticky top-0 z-10">
          <h2 className="text-xl font-bold text-white truncate pr-4">{book.title}</h2>
          <button 
            onClick={onClose} 
            className="p-2 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="p-6 md:p-8">
            <div className="grid grid-cols-1 md:grid-cols-[240px_1fr] gap-8">
              
              {/* Left Column: Cover Image */}
              <div className="flex flex-col items-center">
                <div className="w-[180px] md:w-full aspect-[1/1.4] rounded-lg shadow-2xl overflow-hidden border border-white/10 bg-slate-800 mb-6">
                  {book.cover ? (
                    <img 
                      src={book.cover} 
                      alt={book.title} 
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-600">No Image</div>
                  )}
                </div>
                
                {/* Mobile Actions (Hidden on Desktop) */}
                <button 
                  onClick={() => { onAdd(book); onClose(); }}
                  className="w-full md:hidden bg-accent hover:bg-accent-dark text-white font-bold py-3 px-4 rounded-xl shadow-lg shadow-accent/20 mb-3"
                >
                  검토대기에 추가
                </button>
              </div>

              {/* Right Column: Details */}
              <div className="text-gray-300 space-y-6">
                
                {/* Basic Info */}
                <div className="space-y-4">
                  <div className="flex flex-col gap-1">
                    <span className="text-sm text-gray-400">저자</span>
                    <span className="text-lg font-medium text-white">{book.author}</span>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1">
                      <span className="text-sm text-gray-400 flex items-center gap-1"><BookOpen size={14}/> 출판사</span>
                      <span className="text-white">{book.publisher}</span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-sm text-gray-400 flex items-center gap-1"><Calendar size={14}/> 출간일</span>
                      <span className="text-white">{book.pubDate}</span>
                    </div>
                  </div>

                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1">
                      <span className="text-sm text-gray-400 flex items-center gap-1"><Tag size={14}/> ISBN</span>
                      <span className="text-white font-mono">{book.isbn13}</span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-sm text-gray-400 flex items-center gap-1"><Tag size={14}/> 카테고리</span>
                      <span className="text-white truncate" title={book.categoryName}>
                        {book.categoryName?.split('>').pop() || '미분류'}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1 p-4 rounded-xl bg-white/5 border border-white/5 mt-2">
                    <span className="text-sm text-gray-400 flex items-center gap-1"><CreditCard size={14}/> 가격 정보</span>
                    <div className="flex items-end gap-3 mt-1">
                      <span className="text-2xl font-bold text-emerald-400">{book.priceSales.toLocaleString()}원</span>
                      {book.priceStandard > book.priceSales && (
                        <span className="text-sm text-gray-500 line-through mb-1.5">{book.priceStandard.toLocaleString()}원</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Description */}
                {book.description && (
                  <div className="pt-6 border-t border-white/10">
                    <h3 className="text-lg font-bold text-white mb-3">도서 소개</h3>
                    <p className="leading-relaxed text-gray-300 text-sm whitespace-pre-wrap">
                      {book.description}
                    </p>
                  </div>
                )}
                
                {/* External Link */}
                {book.link && (
                  <div className="pt-4">
                    <a 
                      href={book.link} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 hover:underline"
                    >
                      <ExternalLink size={14} /> 알라딘에서 자세히 보기
                    </a>
                  </div>
                )}

              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-white/10 bg-white/5 backdrop-blur-md flex justify-end gap-3 sticky bottom-0 z-10">
          <button 
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl font-medium text-gray-300 hover:bg-white/10 transition-colors"
          >
            닫기
          </button>
          <button 
            onClick={() => { onAdd(book); onClose(); }}
            className="hidden md:block px-6 py-2.5 rounded-xl font-bold text-white bg-accent hover:bg-accent-dark shadow-lg shadow-accent/20 transition-all active:scale-95"
          >
            검토대기에 추가
          </button>
        </div>

      </div>
    </div>
  );
};

export default BookDetailModal;
