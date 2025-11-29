
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Book, ApiKeys, FetchSource, GeminiAnalysis, SearchTarget, FilterState, SortState, BudgetSettings, BudgetStatus } from './types';
import { fetchBooks, searchBooks } from './services/bookService';
import { analyzeAcquisitionList } from './services/geminiService';
import { DEFAULT_BUDGET_SETTINGS, calculateBudgetStatus } from './utils/budgetUtils';
import BookCard from './components/BookCard';
import ApiKeyModal from './components/ApiKeyModal';
import BookFilterPanel from './components/BookFilterPanel';
import BudgetManager from './components/BudgetManager';
import BudgetDashboard from './components/BudgetDashboard';
import { Settings, Search, BookOpen, Star, TrendingUp, ArrowRight, Sparkles, Download, Loader2, AlertCircle, Key, Library, BookCopy, Zap, Award, RotateCcw, Filter, PieChart, LayoutList, CheckSquare, X } from 'lucide-react';

// Mobile Tab Types
type MobileTab = 'discovery' | 'review' | 'confirmed';

function App() {
  // Kanban Columns Data
  const [discoveryBooks, setDiscoveryBooks] = useState<Book[]>([]);
  const [reviewBooks, setReviewBooks] = useState<Book[]>([]);
  const [confirmedBooks, setConfirmedBooks] = useState<Book[]>([]);
  
  // Mobile Navigation State
  const [activeMobileTab, setActiveMobileTab] = useState<MobileTab>('discovery');
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  const excludedIdsRef = useRef<Set<string>>(new Set());

  const [isLoading, setIsLoading] = useState(false);
  const [activeSource, setActiveSource] = useState<FetchSource>('combined');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchTarget, setSearchTarget] = useState<SearchTarget>('Keyword');
  const [isSearching, setIsSearching] = useState(false);
  const [page, setPage] = useState(1);

  const [isKeyModalOpen, setIsKeyModalOpen] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  
  const [analysis, setAnalysis] = useState<GeminiAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  // Filter & Sort
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filterState, setFilterState] = useState<FilterState>(() => {
    const saved = localStorage.getItem('smart_acquisition_filters');
    return saved ? JSON.parse(saved) : { priceRange: 'all', categories: [], pubYear: 'all', publishers: [] };
  });
  
  const [sortState, setSortState] = useState<SortState>(() => {
    const saved = localStorage.getItem('smart_acquisition_sort');
    return saved ? JSON.parse(saved) : { field: 'pubDate', direction: 'desc' };
  });

  // Budget
  const [isBudgetManagerOpen, setIsBudgetManagerOpen] = useState(false);
  const [isBudgetDashboardOpen, setIsBudgetDashboardOpen] = useState(false); // For mobile modal
  const [budgetSettings, setBudgetSettings] = useState<BudgetSettings>(() => {
     const saved = localStorage.getItem('smart_acquisition_budget');
     return saved ? JSON.parse(saved) : DEFAULT_BUDGET_SETTINGS;
  });

  const budgetStatus: BudgetStatus = useMemo(() => {
     return calculateBudgetStatus(confirmedBooks, budgetSettings);
  }, [confirmedBooks, budgetSettings]);

  const [apiKeys, setApiKeys] = useState<ApiKeys>(() => {
    const saved = localStorage.getItem('smart_acquisition_keys');
    const initial = saved ? JSON.parse(saved) : { aladinTtb: '', nlkApiKey: '' };
    if (!initial.aladinTtb) initial.aladinTtb = 'ttbnamyeogi1645001';
    return initial;
  });

  // Effects
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => localStorage.setItem('smart_acquisition_filters', JSON.stringify(filterState)), [filterState]);
  useEffect(() => localStorage.setItem('smart_acquisition_sort', JSON.stringify(sortState)), [sortState]);
  useEffect(() => localStorage.setItem('smart_acquisition_budget', JSON.stringify(budgetSettings)), [budgetSettings]);
  useEffect(() => { excludedIdsRef.current = new Set([...reviewBooks, ...confirmedBooks].map(b => b.id)); }, [reviewBooks, confirmedBooks]);

  // Data Processing
  const filteredDiscoveryBooks = useMemo(() => {
    let result = [...discoveryBooks];
    if (filterState.priceRange !== 'all') {
      result = result.filter(book => {
        const price = book.priceSales;
        switch (filterState.priceRange) {
          case 'under_10k': return price < 10000;
          case '10k_20k': return price >= 10000 && price < 20000;
          case '20k_30k': return price >= 20000 && price < 30000;
          case 'over_30k': return price >= 30000;
          default: return true;
        }
      });
    }
    if (filterState.pubYear !== 'all') {
      const now = new Date();
      result = result.filter(book => {
        const pubDate = new Date(book.pubDate);
        if (isNaN(pubDate.getTime())) return true;
        const diffDays = Math.ceil(Math.abs(now.getTime() - pubDate.getTime()) / (1000 * 60 * 60 * 24));
        switch (filterState.pubYear) {
          case '1yr': return diffDays <= 365;
          case '3yr': return diffDays <= 365 * 3;
          case '5yr': return diffDays <= 365 * 5;
          default: return true;
        }
      });
    }
    if (filterState.categories.length > 0) result = result.filter(book => filterState.categories.some(cat => book.categoryName?.includes(cat)));
    if (filterState.publishers.length > 0) result = result.filter(book => filterState.publishers.includes(book.publisher));

    result.sort((a, b) => {
      let comparison = 0;
      switch (sortState.field) {
        case 'priceSales': comparison = a.priceSales - b.priceSales; break;
        case 'pubDate': comparison = new Date(a.pubDate).getTime() - new Date(b.pubDate).getTime(); break;
        case 'title': comparison = a.title.localeCompare(b.title); break;
        case 'author': comparison = a.author.localeCompare(b.author); break;
      }
      return sortState.direction === 'asc' ? comparison : -comparison;
    });
    return result;
  }, [discoveryBooks, filterState, sortState]);

  // API Calls
  const loadDiscoveryBooks = useCallback(async (source: FetchSource, currentPage: number) => {
    if (source === 'editorRecommend' && !apiKeys.nlkApiKey) { setDiscoveryBooks([]); return; }
    if (source !== 'editorRecommend' && !apiKeys.aladinTtb) { setDiscoveryBooks([]); return; }
    setIsLoading(true); setFetchError(null);
    try {
      const data = await fetchBooks(source, apiKeys.aladinTtb, apiKeys.nlkApiKey, currentPage);
      const currentExcluded = excludedIdsRef.current;
      setDiscoveryBooks(data.filter(b => !currentExcluded.has(b.id)));
    } catch (error) {
      setFetchError(`도서 정보 로드 실패: ${error instanceof Error ? error.message : "알 수 없는 오류"}`);
      setDiscoveryBooks([]);
    } finally {
      setIsLoading(false);
    }
  }, [apiKeys]);

  useEffect(() => { if (!searchQuery) loadDiscoveryBooks(activeSource, page); }, [activeSource, loadDiscoveryBooks, page]);

  const handleSourceChange = (source: FetchSource) => {
    if (source === 'editorRecommend' && !apiKeys.nlkApiKey) setIsKeyModalOpen(true);
    setActiveSource(source); setPage(1); setSearchQuery('');
  };

  const handleSearch = async (e?: React.FormEvent, targetPage: number = 1) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim() || !apiKeys.aladinTtb) return;
    setIsSearching(true); setIsLoading(true); setFetchError(null);
    if (targetPage === 1) setPage(1);
    try {
      const data = await searchBooks(searchQuery, apiKeys.aladinTtb, searchTarget, targetPage);
      const currentExcluded = excludedIdsRef.current;
      setDiscoveryBooks(data.filter(b => !currentExcluded.has(b.id)));
      if (data.length === 0) setFetchError("검색 결과가 없습니다.");
    } catch (error) {
      setFetchError(`검색 실패: ${error instanceof Error ? error.message : "오류"}`);
    } finally {
      setIsLoading(false); setIsSearching(false);
    }
  };

  const moveBook = (book: Book, action: 'add' | 'approve' | 'remove' | 'return') => {
    if (action === 'add') {
      setDiscoveryBooks(prev => prev.filter(b => b.id !== book.id));
      setReviewBooks(prev => [{ ...book, status: 'review' }, ...prev]);
    } else if (action === 'approve') {
      setReviewBooks(prev => prev.filter(b => b.id !== book.id));
      setConfirmedBooks(prev => [{ ...book, status: 'confirmed' }, ...prev]);
      setAnalysis(null);
    } else if (action === 'return') {
      if (book.status === 'confirmed') {
        setConfirmedBooks(prev => prev.filter(b => b.id !== book.id));
        setReviewBooks(prev => [{ ...book, status: 'review' }, ...prev]);
        setAnalysis(null);
      } else if (book.status === 'review') {
         setReviewBooks(prev => prev.filter(b => b.id !== book.id));
      }
    }
  };

  const handleAnalyze = async () => {
    if (confirmedBooks.length === 0) return;
    setIsAnalyzing(true);
    try {
      const result = await analyzeAcquisitionList(confirmedBooks);
      setAnalysis(result);
    } catch { alert("분석 실패"); } finally { setIsAnalyzing(false); }
  };

  const handleDownloadOrder = () => {
    if (confirmedBooks.length === 0) return;
    const bom = '\uFEFF';
    const csvContent = bom + [
      ['제목', '저자', '출판사', '출판일', '정가', '판매가', 'ISBN', '카테고리'].join(','),
      ...confirmedBooks.map(b => [
        `"${b.title.replace(/"/g, '""')}"`, `"${b.author}"`, `"${b.publisher}"`, `"${b.pubDate}"`, b.priceStandard, b.priceSales, `"${b.isbn13}"`, `"${b.categoryName}"`
      ].join(','))
    ].join('\n');
    const url = URL.createObjectURL(new Blob([csvContent], { type: 'text/csv;charset=utf-8;' }));
    const link = document.createElement('a');
    link.href = url; link.download = `도서수서목록_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const renderEmptyState = (type: 'discovery' | 'review' | 'confirmed') => {
    if (type === 'discovery') {
       if (fetchError) return <div className="p-8 text-center text-gray-400"><AlertCircle className="mx-auto mb-2" />{fetchError}<button onClick={() => loadDiscoveryBooks(activeSource, page)} className="block mx-auto mt-2 underline">재시도</button></div>;
       return <div className="p-8 text-center text-gray-400"><Search className="mx-auto mb-2 opacity-20" size={48} /><p>도서가 없습니다.</p></div>;
    }
    if (type === 'review') return <div className="p-8 text-center text-indigo-300/50"><div className="border-2 border-dashed border-indigo-200/50 rounded-lg p-6"><p>도서를 선택하세요</p></div></div>;
    return <div className="p-8 text-center text-green-300/50"><div className="border-2 border-dashed border-green-200/50 rounded-lg p-6"><p>확정된 도서 없음</p></div></div>;
  };

  // Render Component Blocks
  const DiscoveryColumn = () => (
    <div className="flex h-full flex-col rounded-none md:rounded-2xl bg-gray-50 border-x md:border border-gray-200 dark:bg-slate-800/50 dark:border-gray-700 w-full">
        {/* Header Section */}
        <div className="bg-white dark:bg-slate-800 p-4 border-b border-gray-200 dark:border-gray-700 md:rounded-t-2xl sticky top-0 z-10">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className={`flex h-6 w-6 items-center justify-center rounded text-white ${activeSource === 'editorRecommend' ? 'bg-green-500' : 'bg-blue-500'}`}>
                   {activeSource === 'editorRecommend' ? <Library size={14} /> : <Search size={14} />}
                </span>
                <h2 className="font-bold text-gray-800 dark:text-gray-200 text-sm md:text-base truncate max-w-[200px]">
                   {searchQuery ? '검색 결과' : activeSource === 'editorRecommend' ? '사서 추천' : activeSource === 'bestseller' ? '베스트셀러' : '도서 탐색'}
                </h2>
                <span className="bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full text-xs">{filteredDiscoveryBooks.length}</span>
              </div>
              <button onClick={() => { setPage(p => p + 1); if(searchQuery) handleSearch(undefined, page + 1); }} className="p-2 hover:bg-gray-100 rounded-full"><RotateCcw size={16} /></button>
            </div>
            
            {/* Search Bar */}
            <form onSubmit={(e) => handleSearch(e, 1)} className="flex gap-2 mb-2">
               <select value={searchTarget} onChange={(e) => setSearchTarget(e.target.value as SearchTarget)} className="w-[80px] rounded-lg border border-gray-200 bg-gray-50 text-xs py-2 px-1 dark:bg-slate-700 dark:border-gray-600">
                  <option value="Keyword">전체</option><option value="Title">제목</option><option value="Author">저자</option>
               </select>
               <div className="relative flex-1">
                  <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="검색 (1년 이내)" className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2 pl-8 pr-3 text-xs dark:bg-slate-700 dark:border-gray-600" />
                  <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
               </div>
            </form>
            <BookFilterPanel books={discoveryBooks} filterState={filterState} setFilterState={setFilterState} sortState={sortState} setSortState={setSortState} isOpen={isFilterOpen} onToggle={() => setIsFilterOpen(!isFilterOpen)} />
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-3 custom-scrollbar bg-gray-50 dark:bg-slate-900/50">
           {isLoading ? <div className="flex h-full items-center justify-center"><Loader2 className="animate-spin" /></div> : 
             <div className="space-y-3 pb-20 md:pb-0">
               {filteredDiscoveryBooks.length === 0 ? renderEmptyState('discovery') : filteredDiscoveryBooks.map(book => <BookCard key={book.id} book={book} onAction={moveBook} />)}
             </div>
           }
        </div>
    </div>
  );

  const ReviewColumn = () => (
    <div className="flex h-full flex-col rounded-none md:rounded-2xl bg-indigo-50/50 border-x md:border border-indigo-100 dark:bg-slate-800/50 dark:border-gray-700 w-full">
        <div className="p-4 border-b border-indigo-100 bg-white dark:bg-slate-800 md:rounded-t-2xl sticky top-0 z-10">
           <div className="flex items-center gap-2">
              <span className="bg-indigo-100 text-indigo-600 p-1 rounded"><BookOpen size={16} /></span>
              <h2 className="font-bold">검토 대기</h2>
              <span className="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full text-xs">{reviewBooks.length}</span>
           </div>
        </div>
        <div className="flex-1 overflow-y-auto p-3 custom-scrollbar pb-20 md:pb-0">
           <div className="space-y-3">
              {reviewBooks.length === 0 ? renderEmptyState('review') : reviewBooks.map(book => <BookCard key={book.id} book={book} onAction={moveBook} />)}
           </div>
        </div>
    </div>
  );

  const ConfirmedColumn = () => (
    <div className="flex h-full flex-col rounded-none md:rounded-2xl bg-green-50/50 border-x md:border border-green-100 dark:bg-slate-800/50 dark:border-gray-700 w-full">
        <div className="p-4 border-b border-green-100 bg-white dark:bg-slate-800 md:rounded-t-2xl sticky top-0 z-10">
           <div className="flex items-center gap-2">
              <span className="bg-green-100 text-green-600 p-1 rounded"><Star size={16} /></span>
              <h2 className="font-bold">최종 확정</h2>
              <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-xs">{confirmedBooks.length}</span>
           </div>
        </div>
        <div className="flex-1 overflow-y-auto p-3 custom-scrollbar pb-24 md:pb-0 relative">
           {/* Budget Dashboard (Desktop: Inline, Mobile: Hidden/Modal) */}
           <div className="hidden md:block">
              <BudgetDashboard status={budgetStatus} />
           </div>

           {/* AI Analysis Card */}
           {analysis && (
              <div className="mb-4 bg-white p-3 rounded-xl border border-green-100 shadow-sm animate-fade-in-up">
                 <div className="flex gap-2 text-indigo-600 font-bold text-xs mb-2"><Sparkles size={14}/> AI 분석</div>
                 <p className="text-xs text-gray-600 mb-2">{analysis.summary}</p>
                 <div className="text-xs font-bold text-accent">추천 점수: {analysis.recommendationScore}점</div>
              </div>
           )}

           <div className="space-y-3">
              {confirmedBooks.length === 0 ? renderEmptyState('confirmed') : confirmedBooks.map(book => <BookCard key={book.id} book={book} onAction={moveBook} />)}
           </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-green-100 bg-white dark:bg-slate-800 md:rounded-b-2xl sticky bottom-[60px] md:bottom-0 z-20">
           <div className="grid grid-cols-2 gap-2">
              <button onClick={handleAnalyze} disabled={confirmedBooks.length === 0} className="flex items-center justify-center gap-2 bg-indigo-600 text-white py-2.5 rounded-lg text-sm font-bold shadow disabled:opacity-50">
                {isAnalyzing ? <Loader2 className="animate-spin" size={16} /> : <Sparkles size={16} />} AI 분석
              </button>
              <button onClick={handleDownloadOrder} disabled={confirmedBooks.length === 0} className="flex items-center justify-center gap-2 bg-green-600 text-white py-2.5 rounded-lg text-sm font-bold shadow disabled:opacity-50">
                <Download size={16} /> 주문서
              </button>
           </div>
        </div>
    </div>
  );

  return (
    <div className="flex h-screen flex-col bg-gray-100 text-gray-900 dark:bg-slate-900 dark:text-gray-100 font-sans overflow-hidden">
      
      {/* --- HEADER --- */}
      <header className="z-30 shrink-0 bg-white border-b border-gray-200 dark:bg-slate-900 dark:border-gray-800 shadow-sm transition-all duration-300">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between mb-3 md:mb-0">
            <div className="flex items-center gap-2 md:gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-white shadow-lg">
                <TrendingUp size={20} />
              </div>
              <h1 className="text-lg md:text-xl font-bold tracking-tight">
                <span className="hidden md:inline">Smart</span>Acquisition
              </h1>
            </div>
            
            {/* Desktop Settings Buttons */}
            <div className="flex items-center gap-2">
               <button onClick={() => setIsBudgetManagerOpen(true)} className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-gray-100 text-sm font-medium"><PieChart size={16}/> 예산 관리</button>
               <button onClick={() => setIsKeyModalOpen(true)} className="p-2 md:px-3 md:py-1.5 rounded-lg hover:bg-gray-100 text-gray-600 dark:text-gray-300">
                 <Settings size={20} className="md:w-5 md:h-5" />
               </button>
            </div>
          </div>

          {/* Source Tabs (Scrollable on Mobile) */}
          <div className="flex -mx-4 px-4 overflow-x-auto scrollbar-hide space-x-2 md:mx-0 md:px-0 md:mt-3 pb-1 md:pb-0">
             {[
               { id: 'combined', label: '종합 (100)', icon: BookCopy, color: 'text-accent' },
               { id: 'bestseller', label: '베스트셀러', icon: Award, color: 'text-purple-600' },
               { id: 'itemNewSpecial', label: '신간', icon: Zap, color: 'text-amber-600' },
               { id: 'editorRecommend', label: '사서 추천', icon: Library, color: 'text-green-600' }
             ].map((src) => (
               <button 
                 key={src.id}
                 onClick={() => handleSourceChange(src.id as FetchSource)}
                 className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-full whitespace-nowrap transition-all border ${activeSource === src.id ? `bg-white border-gray-200 shadow-sm font-bold ${src.color}` : 'border-transparent text-gray-500 hover:bg-gray-100'}`}
               >
                 <src.icon size={14} /> {src.label}
               </button>
             ))}
          </div>
        </div>
      </header>

      {/* --- MAIN CONTENT --- */}
      <main className="flex-1 overflow-hidden relative">
        {/* Responsive Grid System */}
        <div className="h-full w-full">
          {/* Mobile View: Single Column based on active Tab */}
          <div className="md:hidden h-full w-full">
            {activeMobileTab === 'discovery' && <DiscoveryColumn />}
            {activeMobileTab === 'review' && <ReviewColumn />}
            {activeMobileTab === 'confirmed' && <ConfirmedColumn />}
          </div>

          {/* Desktop/Tablet View: Grid */}
          <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 gap-6 p-6 h-full overflow-x-auto">
             <div className="h-full min-w-[320px]"><DiscoveryColumn /></div>
             <div className="h-full min-w-[320px]"><ReviewColumn /></div>
             <div className="h-full min-w-[320px]"><ConfirmedColumn /></div>
          </div>
        </div>
      </main>

      {/* --- MOBILE BOTTOM NAVIGATION --- */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 h-[60px] bg-white border-t border-gray-200 dark:bg-slate-900 dark:border-gray-800 flex items-center justify-around z-40 pb-safe">
         <button onClick={() => setActiveMobileTab('discovery')} className={`flex flex-col items-center gap-1 p-2 ${activeMobileTab === 'discovery' ? 'text-accent' : 'text-gray-400'}`}>
            <LayoutList size={20} /> <span className="text-[10px] font-bold">탐색</span>
         </button>
         <button onClick={() => setActiveMobileTab('review')} className={`flex flex-col items-center gap-1 p-2 ${activeMobileTab === 'review' ? 'text-indigo-500' : 'text-gray-400'}`}>
            <CheckSquare size={20} /> <span className="text-[10px] font-bold">검토</span>
            {reviewBooks.length > 0 && <span className="absolute top-2 ml-4 w-4 h-4 bg-indigo-500 rounded-full text-[9px] text-white flex items-center justify-center">{reviewBooks.length}</span>}
         </button>
         <button onClick={() => setActiveMobileTab('confirmed')} className={`flex flex-col items-center gap-1 p-2 ${activeMobileTab === 'confirmed' ? 'text-green-600' : 'text-gray-400'}`}>
            <Star size={20} /> <span className="text-[10px] font-bold">확정</span>
            {confirmedBooks.length > 0 && <span className="absolute top-2 ml-4 w-4 h-4 bg-green-500 rounded-full text-[9px] text-white flex items-center justify-center">{confirmedBooks.length}</span>}
         </button>
      </div>

      {/* --- MOBILE FLOATING ACTION BUTTON (Budget) --- */}
      <div className="md:hidden fixed bottom-[70px] right-4 z-40">
        <button 
          onClick={() => setIsBudgetDashboardOpen(true)}
          className="flex items-center justify-center w-12 h-12 bg-gray-900 text-white rounded-full shadow-xl hover:bg-gray-800 transition-transform active:scale-95"
        >
          <PieChart size={24} />
        </button>
      </div>

      {/* --- MODALS --- */}
      <ApiKeyModal isOpen={isKeyModalOpen} onClose={() => setIsKeyModalOpen(false)} onSave={(k) => { setApiKeys(k); localStorage.setItem('smart_acquisition_keys', JSON.stringify(k)); window.location.reload(); }} initialKeys={apiKeys} />
      <BudgetManager isOpen={isBudgetManagerOpen} onClose={() => setIsBudgetManagerOpen(false)} onSave={setBudgetSettings} currentSettings={budgetSettings} />

      {/* Mobile Budget Modal */}
      {isBudgetDashboardOpen && (
         <div className="fixed inset-0 z-50 flex items-end justify-center md:hidden">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsBudgetDashboardOpen(false)} />
            <div className="relative w-full bg-white dark:bg-slate-900 rounded-t-2xl p-4 animate-fade-in-up">
               <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-lg">예산 현황</h3>
                  <div className="flex gap-2">
                     <button onClick={() => { setIsBudgetDashboardOpen(false); setIsBudgetManagerOpen(true); }} className="text-sm bg-gray-100 px-3 py-1 rounded">설정</button>
                     <button onClick={() => setIsBudgetDashboardOpen(false)}><X size={24} className="text-gray-500"/></button>
                  </div>
               </div>
               <BudgetDashboard status={budgetStatus} compact={true} />
            </div>
         </div>
      )}
    </div>
  );
}

export default App;
