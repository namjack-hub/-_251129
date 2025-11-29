

export interface Book {
  id: string;
  title: string;
  author: string;
  publisher: string;
  pubDate: string;
  cover: string;
  description: string;
  isbn13: string;
  priceStandard: number;
  priceSales: number;
  link: string;
  categoryName?: string;
  status?: BookStatus; // New field for Kanban
}

export type BookStatus = 'discovery' | 'review' | 'confirmed';

export interface ApiKeys {
  aladinTtb: string;
  nlkApiKey?: string; // National Library of Korea API Key
}

export type FetchSource = 'combined' | 'bestseller' | 'itemNewSpecial' | 'editorRecommend';

export type SearchTarget = 'Keyword' | 'Title' | 'Author' | 'Publisher';

export interface CartItem extends Book {
  addedAt: number;
}

export interface GeminiAnalysis {
  summary: string;
  budgetAnalysis: string;
  categoryBreakdown: string;
  recommendationScore: number;
}

// --- New Types for Filtering & Sorting ---

export type PriceRangeOption = 'all' | 'under_10k' | '10k_20k' | '20k_30k' | 'over_30k';
export type PubYearOption = 'all' | '1yr' | '3yr' | '5yr';
export type SortField = 'pubDate' | 'priceSales' | 'title' | 'author';
export type SortDirection = 'asc' | 'desc';

export interface FilterState {
  priceRange: PriceRangeOption;
  categories: string[]; // Selected category names
  pubYear: PubYearOption;
  publishers: string[]; // Selected publisher names
}

export interface SortState {
  field: SortField;
  direction: SortDirection;
}