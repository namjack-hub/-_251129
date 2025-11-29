import React, { useMemo } from 'react';
import { Book, FilterState, SortState, PriceRangeOption, PubYearOption, SortField } from '../types';
import { Filter, X, ChevronDown, ChevronUp, Check, RotateCcw, ArrowDownAZ, ArrowUpAZ, Calendar, DollarSign } from 'lucide-react';

interface BookFilterPanelProps {
  books: Book[]; // To extract available categories/publishers
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
  // Extract unique categories and publishers from current books
  const { availableCategories, availablePublishers } = useMemo(() => {
    const cats = new Set<string>();
    const pubs = new Set<string>();

    books.forEach(book => {
      if (book.categoryName) {
        // Aladin categories are like "Domestic > Fiction > Korean Fiction"
        // We take the simplified category (usually 1st or 2nd part) for filtering
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

  const handlePriceChange = (val: PriceRangeOption) => {
    setFilterState({ ...filterState, priceRange: val });
  };

  const handleYearChange = (val: PubYearOption) => {
    setFilterState({ ...filterState, pubYear: val });
  };

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
    setFilterState({
      priceRange: 'all',
      categories: [],
      pubYear: 'all',
      publishers: []
    });
  };

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (value === 'newest') setSortState({ field: 'pubDate', direction: 'desc' });
    else if (value === 'price_low') setSortState({ field: 'priceSales', direction: 'asc' });
    else if (value === 'price_high') setSortState({ field: 'priceSales', direction: 'desc' });
    else if (value === 'title') setSortState({ field: 'title', direction: 'asc' });
    else if (value === 'author') setSortState({ field: 'author', direction: 'asc' });
  };

  // Check if any filter is active
  const hasActiveFilters = 
    filterState.priceRange !== 'all' || 
    filterState.pubYear !== 'all' || 
    filterState.categories.length > 0 || 
    filterState.publishers.length > 0;

  return (
    <div className="bg-white border-b border-gray-200 dark:bg-slate-800 dark:border-gray-700 transition-all">
      {/* Header / Toggle Bar */}
      <div className="flex items-center justify-between p-3 px-4">
        <button 
          onClick={onToggle}
          className={`flex items-center gap-2 text-sm font-medium transition-colors ${isOpen || hasActiveFilters ? 'text-accent' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'}`}
        >
          <Filter size={16} />
          <span>필터 & 정렬</span>
          {hasActiveFilters && (
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-accent text-[10px] text-white">
              !
            </span>
          )}
          {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>

        <div className="flex items-center gap-2">
          {/* Quick Sort Dropdown (Always visible) */}
          <select 
            className="h-8 rounded-md border border-gray-200 bg-gray-50 text-xs text-gray-700 outline-none focus:border-accent dark:border-gray-600 dark:bg-slate-700 dark:text-gray-200"
            onChange={handleSortChange}
            value={
              sortState.field === 'pubDate' ? 'newest' :
              sortState.field === 'priceSales' && sortState.direction === 'asc' ? 'price_low' :
              sortState.field === 'priceSales' && sortState.direction === 'desc' ? 'price_high' :
              sortState.field === 'title' ? 'title' : 'author'
            }
          >
            <option value="newest">최신순</option>
            <option value="price_low">가격 낮은순</option>
            <option value="price_high">가격 높은순</option>
            <option value="title">제목순</option>
            <option value="author">저자순</option>
          </select>
        </div>
      </div>

      {/* Expanded Filter Panel */}
      {isOpen && (
        <div className="border-t border-gray-100 bg-gray-50/50 p-4 dark:border-gray-700 dark:bg-slate-800/50 animate-fade-in-up">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            
            {/* Price Filter */}
            <div className="space-y-2">
              <h4 className="flex items-center gap-1 text-xs font-bold text-gray-500 dark:text-gray-400">
                <DollarSign size={12} /> 가격
              </h4>
              <div className="flex flex-col gap-1">
                {[
                  { id: 'all', label: '전체' },
                  { id: 'under_10k', label: '1만원 미만' },
                  { id: '10k_20k', label: '1~2만원' },
                  { id: '20k_30k', label: '2~3만원' },
                  { id: 'over_30k', label: '3만원 이상' },
                ].map((opt) => (
                  <label key={opt.id} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-black/5 p-1 rounded">
                    <input 
                      type="radio" 
                      name="price" 
                      checked={filterState.priceRange === opt.id}
                      onChange={() => handlePriceChange(opt.id as PriceRangeOption)}
                      className="accent-accent"
                    />
                    <span className="text-gray-700 dark:text-gray-300">{opt.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Year Filter */}
            <div className="space-y-2">
              <h4 className="flex items-center gap-1 text-xs font-bold text-gray-500 dark:text-gray-400">
                <Calendar size={12} /> 출판연도
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
                    className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                      filterState.pubYear === opt.id 
                      ? 'bg-accent text-white border-accent' 
                      : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-100 dark:bg-slate-700 dark:text-gray-300 dark:border-gray-600'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Category Filter */}
            <div className="space-y-2">
              <h4 className="flex items-center gap-1 text-xs font-bold text-gray-500 dark:text-gray-400">
                카테고리
              </h4>
              <div className="max-h-32 overflow-y-auto custom-scrollbar rounded-md border border-gray-200 bg-white p-2 dark:border-gray-600 dark:bg-slate-700">
                {availableCategories.length === 0 ? (
                  <p className="text-xs text-gray-400">카테고리 정보 없음</p>
                ) : (
                  availableCategories.map(cat => (
                    <label key={cat} className="flex items-center gap-2 p-1 text-xs cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-600 rounded">
                      <input 
                        type="checkbox"
                        checked={filterState.categories.includes(cat)}
                        onChange={() => toggleCategory(cat)}
                        className="rounded border-gray-300 accent-accent"
                      />
                      <span className="line-clamp-1 text-gray-700 dark:text-gray-200">{cat}</span>
                    </label>
                  ))
                )}
              </div>
            </div>

             {/* Publisher Filter */}
             <div className="space-y-2">
              <h4 className="flex items-center gap-1 text-xs font-bold text-gray-500 dark:text-gray-400">
                출판사
              </h4>
              <div className="max-h-32 overflow-y-auto custom-scrollbar rounded-md border border-gray-200 bg-white p-2 dark:border-gray-600 dark:bg-slate-700">
                {availablePublishers.length === 0 ? (
                  <p className="text-xs text-gray-400">출판사 정보 없음</p>
                ) : (
                  availablePublishers.map(pub => (
                    <label key={pub} className="flex items-center gap-2 p-1 text-xs cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-600 rounded">
                      <input 
                        type="checkbox"
                        checked={filterState.publishers.includes(pub)}
                        onChange={() => togglePublisher(pub)}
                        className="rounded border-gray-300 accent-accent"
                      />
                      <span className="line-clamp-1 text-gray-700 dark:text-gray-200">{pub}</span>
                    </label>
                  ))
                )}
              </div>
            </div>

          </div>

          {/* Active Tags & Reset */}
          {hasActiveFilters && (
            <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-gray-200 pt-3 dark:border-gray-700">
              <span className="text-xs font-medium text-gray-500">적용됨:</span>
              
              {filterState.priceRange !== 'all' && (
                <span className="flex items-center gap-1 rounded-md bg-blue-50 px-2 py-1 text-xs text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                  가격: {filterState.priceRange === 'under_10k' ? '< 1만' : filterState.priceRange === '10k_20k' ? '1~2만' : filterState.priceRange === '20k_30k' ? '2~3만' : '> 3만'}
                  <button onClick={() => handlePriceChange('all')}><X size={12} /></button>
                </span>
              )}

              {filterState.pubYear !== 'all' && (
                <span className="flex items-center gap-1 rounded-md bg-green-50 px-2 py-1 text-xs text-green-700 dark:bg-green-900/30 dark:text-green-300">
                   {filterState.pubYear === '1yr' ? '최근 1년' : filterState.pubYear === '3yr' ? '최근 3년' : '최근 5년'}
                  <button onClick={() => handleYearChange('all')}><X size={12} /></button>
                </span>
              )}

              {filterState.categories.map(cat => (
                <span key={cat} className="flex items-center gap-1 rounded-md bg-purple-50 px-2 py-1 text-xs text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
                  {cat}
                  <button onClick={() => toggleCategory(cat)}><X size={12} /></button>
                </span>
              ))}

              {filterState.publishers.map(pub => (
                <span key={pub} className="flex items-center gap-1 rounded-md bg-amber-50 px-2 py-1 text-xs text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                  {pub}
                  <button onClick={() => togglePublisher(pub)}><X size={12} /></button>
                </span>
              ))}

              <button 
                onClick={resetFilters}
                className="ml-auto flex items-center gap-1 text-xs text-gray-500 hover:text-red-500 transition-colors"
              >
                <RotateCcw size={12} />
                필터 초기화
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default BookFilterPanel;
