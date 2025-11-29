
import React, { useMemo, useEffect } from 'react';
import { Book, FilterState, SortState, PriceRangeOption, PubYearOption } from '../types';
import { Filter, X, ChevronDown, ChevronUp, RotateCcw, DollarSign, Calendar, Check } from 'lucide-react';

interface BookFilterPanelProps {
  books: Book[];
  filterState: FilterState;
  setFilterState: (state: FilterState) => void;
  sortState: SortState;
  setSortState: (state: SortState) => void;
  isOpen: boolean;
  onToggle: () => void;
}

const BookFilterPanel: React.FC<BookFilterPanelProps> = ({
  books,
  filterState,
  setFilterState,
  sortState,
  setSortState,
  isOpen,
  onToggle
}) => {
  // Lock body scroll when mobile modal is open
  useEffect(() => {
    if (window.innerWidth < 768 && isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const { availableCategories, availablePublishers } = useMemo(() => {
    const cats = new Set<string>();
    const pubs = new Set<string>();

    books.forEach(book => {
      if (book.categoryName) {
        const parts = book.categoryName.split('>');
        const mainCat = parts.length > 1 ? parts[1].trim() : parts[0].trim();
        cats.add(mainCat);
      }
      if (book.publisher) {
        pubs.add(book.publisher);
      }
    });

    return {
      availableCategories: Array.from(cats).sort(),
      availablePublishers: Array.from(pubs).sort()
    };
  }, [books]);

  const handlePriceChange = (val: PriceRangeOption) => setFilterState({ ...filterState, priceRange: val });
  const handleYearChange = (val: PubYearOption) => setFilterState({ ...filterState, pubYear: val });

  const toggleCategory = (cat: string) => {
    const newCats = filterState.categories.includes(cat)
      ? filterState.categories.filter(c => c !== cat)
      : [...filterState.categories, cat];
    setFilterState({ ...filterState, categories: newCats });
  };

  const togglePublisher = (pub: string) => {
    const newPubs = filterState.publishers.includes(pub)
      ? filterState.publishers.filter(p => p !== pub)
      : [...filterState.publishers, pub];
    setFilterState({ ...filterState, publishers: newPubs });
  };

  const resetFilters = () => {
    setFilterState({ priceRange: 'all', categories: [], pubYear: 'all', publishers: [] });
  };

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (value === 'newest') setSortState({ field: 'pubDate', direction: 'desc' });
    else if (value === 'price_low') setSortState({ field: 'priceSales', direction: 'asc' });
    else if (value === 'price_high') setSortState({ field: 'priceSales', direction: 'desc' });
    else if (value === 'title') setSortState({ field: 'title', direction: 'asc' });
    else if (value === 'author') setSortState({ field: 'author', direction: 'asc' });
  };

  const hasActiveFilters = 
    filterState.priceRange !== 'all' || 
    filterState.pubYear !== 'all' || 
    filterState.categories.length > 0 || 
    filterState.publishers.length > 0;

  // Mobile Bottom Sheet Content
  const FilterContent = () => (
    <div className="space-y-6">
      {/* Price Filter */}
      <div className="space-y-3">
        <h4 className="flex items-center gap-1 text-sm font-bold text-gray-900 dark:text-gray-200">
          <DollarSign size={14} className="text-gray-500" /> 가격 범위
        </h4>
        <div className="flex flex-wrap gap-2">
          {[
            { id: 'all', label: '전체' },
            { id: 'under_10k', label: '1만원 미만' },
            { id: '10k_20k', label: '1~2만원' },
            { id: '20k_30k', label: '2~3만원' },
            { id: 'over_30k', label: '3만원 이상' },
          ].map((opt) => (
            <label key={opt.id} className={`
              px-3 py-1.5 text-xs rounded-full border cursor-pointer transition-colors
              ${filterState.priceRange === opt.id 
                ? 'bg-accent text-white border-accent' 
                : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50 dark:bg-slate-700 dark:border-gray-600 dark:text-gray-300'}
            `}>
              <input type="radio" name="price" checked={filterState.priceRange === opt.id} onChange={() => handlePriceChange(opt.id as PriceRangeOption)} className="hidden" />
              {opt.label}
            </label>
          ))}
        </div>
      </div>

      {/* Year Filter */}
      <div className="space-y-3">
        <h4 className="flex items-center gap-1 text-sm font-bold text-gray-900 dark:text-gray-200">
          <Calendar size={14} className="text-gray-500" /> 출판 연도
        </h4>
        <div className="flex flex-wrap gap-2">
          {[
            { id: 'all', label: '전체' },
            { id: '1yr', label: '최근 1년' },
            { id: '3yr', label: '최근 3년' },
            { id: '5yr', label: '최근 5년' },
          ].map((opt) => (
            <button
              key={opt.id}
              onClick={() => handleYearChange(opt.id as PubYearOption)}
              className={`px-3 py-1.5 text-xs rounded-full border transition-colors ${
                filterState.pubYear === opt.id 
                ? 'bg-accent text-white border-accent' 
                : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50 dark:bg-slate-700 dark:text-gray-300 dark:border-gray-600'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Categories & Publishers Grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <h4 className="text-sm font-bold text-gray-900 dark:text-gray-200">카테고리</h4>
          <div className="max-h-40 overflow-y-auto rounded-lg border border-gray-200 bg-gray-50 p-2 dark:border-gray-600 dark:bg-slate-700 custom-scrollbar">
            {availableCategories.length === 0 ? <p className="text-xs text-gray-400 p-2">정보 없음</p> : 
              availableCategories.map(cat => (
                <label key={cat} className="flex items-center gap-2 p-1.5 text-sm hover:bg-white dark:hover:bg-slate-600 rounded cursor-pointer">
                  <input type="checkbox" checked={filterState.categories.includes(cat)} onChange={() => toggleCategory(cat)} className="rounded border-gray-300 accent-accent" />
                  <span className="text-gray-700 dark:text-gray-200">{cat}</span>
                </label>
              ))
            }
          </div>
        </div>

        <div className="space-y-2">
          <h4 className="text-sm font-bold text-gray-900 dark:text-gray-200">출판사</h4>
          <div className="max-h-40 overflow-y-auto rounded-lg border border-gray-200 bg-gray-50 p-2 dark:border-gray-600 dark:bg-slate-700 custom-scrollbar">
            {availablePublishers.length === 0 ? <p className="text-xs text-gray-400 p-2">정보 없음</p> : 
              availablePublishers.map(pub => (
                <label key={pub} className="flex items-center gap-2 p-1.5 text-sm hover:bg-white dark:hover:bg-slate-600 rounded cursor-pointer">
                  <input type="checkbox" checked={filterState.publishers.includes(pub)} onChange={() => togglePublisher(pub)} className="rounded border-gray-300 accent-accent" />
                  <span className="text-gray-700 dark:text-gray-200">{pub}</span>
                </label>
              ))
            }
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop & Header View */}
      <div className="bg-white border-b border-gray-200 dark:bg-slate-800 dark:border-gray-700">
        <div className="flex items-center justify-between p-3 px-4">
          <button 
            onClick={onToggle}
            className={`flex items-center gap-2 text-sm font-medium transition-colors ${isOpen || hasActiveFilters ? 'text-accent' : 'text-gray-500'}`}
          >
            <Filter size={16} />
            <span className="hidden md:inline">필터 & 정렬</span>
            <span className="md:hidden">필터</span>
            {hasActiveFilters && <span className="flex h-5 w-5 items-center justify-center rounded-full bg-accent text-[10px] text-white">!</span>}
            <ChevronDown size={14} className={`transition-transform md:block hidden ${isOpen ? 'rotate-180' : ''}`} />
          </button>

          <select 
            className="h-8 rounded-md border border-gray-200 bg-gray-50 text-xs text-gray-700 outline-none focus:border-accent dark:border-gray-600 dark:bg-slate-700 dark:text-gray-200"
            onChange={handleSortChange}
            value={`${sortState.field === 'pubDate' ? 'newest' : sortState.field === 'title' ? 'title' : sortState.field === 'author' ? 'author' : sortState.direction === 'asc' ? 'price_low' : 'price_high'}`}
          >
            <option value="newest">최신순</option>
            <option value="price_low">가격 낮은순</option>
            <option value="price_high">가격 높은순</option>
            <option value="title">제목순</option>
            <option value="author">저자순</option>
          </select>
        </div>

        {/* Desktop Accordion Content */}
        <div className={`hidden md:block overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}>
          <div className="border-t border-gray-100 bg-gray-50/50 p-4 dark:border-gray-700 dark:bg-slate-800/50">
            <FilterContent />
            {hasActiveFilters && (
              <div className="mt-4 flex justify-end">
                <button onClick={resetFilters} className="flex items-center gap-1 text-xs text-gray-500 hover:text-red-500">
                  <RotateCcw size={12} /> 초기화
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Bottom Sheet Modal */}
      {isOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex items-end justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onToggle} />
          <div className="relative w-full max-h-[85vh] bg-white dark:bg-slate-900 rounded-t-2xl shadow-xl flex flex-col animate-fade-in-up">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="font-bold text-lg">필터 설정</h3>
              <button onClick={onToggle} className="p-2 text-gray-500"><X size={24} /></button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
              <FilterContent />
            </div>

            <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-slate-800 flex justify-between items-center gap-3">
              <button 
                onClick={resetFilters} 
                className="px-4 py-3 rounded-xl text-gray-600 bg-white border border-gray-200 font-medium text-sm flex-1 hover:bg-gray-50 dark:bg-slate-700 dark:border-gray-600 dark:text-gray-200"
              >
                초기화
              </button>
              <button 
                onClick={onToggle}
                className="px-4 py-3 rounded-xl bg-accent text-white font-bold text-sm flex-[2] hover:bg-accent-dark shadow-lg shadow-accent/20"
              >
                적용하기 {hasActiveFilters ? '(설정됨)' : ''}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default BookFilterPanel;
