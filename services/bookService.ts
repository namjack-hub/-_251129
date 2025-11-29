
import { Book, FetchSource, SearchTarget } from '../types';

// List of proxies to try in order to ensure reliability
const PROXIES = [
  (url: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
  (url: string) => `https://corsproxy.io/?${encodeURIComponent(url)}` 
];

// Robust fetch function with retries and proxy fallback
async function fetchWithRetry(targetUrl: string, isJson: boolean = true): Promise<any> {
  let lastError: any;

  for (const proxyGenerator of PROXIES) {
    const proxyUrl = proxyGenerator(targetUrl);
    
    // Try 2 times per proxy
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        console.log(`[Fetch Debug] Attempt ${attempt + 1} using proxy: ${proxyUrl}`);
        const response = await fetch(proxyUrl);
        
        console.log(`[Fetch Debug] HTTP Status: ${response.status} ${response.statusText}`);

        if (!response.ok) {
          throw new Error(`HTTP Error: ${response.status}`);
        }
        
        if (isJson) {
          const data = await response.json();
          return data;
        } else {
          const text = await response.text();
          console.log(`[Fetch Debug] Response Text Preview (First 100 chars): ${text.substring(0, 100)}`);
          return text;
        }
      } catch (error) {
        console.warn(`Attempt ${attempt + 1} failed for proxy ${proxyUrl}:`, error);
        lastError = error;
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  }
  
  throw lastError || new Error("Network Error: Failed to fetch data from all proxies.");
}

export const validateTtbKey = async (ttbKey: string): Promise<boolean> => {
  if (!ttbKey) return false;
  try {
    const cleanKey = ttbKey.trim();
    // Added timestamp to prevent caching during validation
    const aladinUrl = `https://www.aladin.co.kr/ttb/api/ItemList.aspx?ttbkey=${cleanKey}&QueryType=Bestseller&MaxResults=1&start=1&SearchTarget=Book&output=js&Version=20131101&_t=${Date.now()}`;
    const data = await fetchWithRetry(aladinUrl);
    if (data.errorCode) return false;
    if (data.item && Array.isArray(data.item)) return true;
    return false;
  } catch (error) {
    return false; 
  }
};

export const validateNlkKey = async (authKey: string): Promise<boolean> => {
  if (!authKey) return false;
  try {
    const cleanKey = authKey.trim();
    // Use saseoApi.do with minimal range for validation
    // PDF Spec: key, startRowNumApi, endRowNumApi
    // NOTE: Using HTTP as per some legacy behaviors, but proxies often force HTTPS.
    // Ensure the domain is correct.
    const nlkUrl = `https://nl.go.kr/NL/search/openApi/saseoApi.do?key=${cleanKey}&startRowNumApi=1&endRowNumApi=1`;
    
    console.log(`[NLK Validation] Requesting URL: ${nlkUrl}`);
    
    const xmlText = await fetchWithRetry(nlkUrl, false);
    
    console.log(`[NLK Validation] Raw Response Length: ${xmlText?.length}`);
    console.log(`[NLK Validation] Raw Response Body:`, xmlText);

    if (!xmlText) {
        console.error("[NLK Validation] Empty response received.");
        return false;
    }

    // Check Format
    if (xmlText.trim().startsWith('{')) {
        console.warn("[NLK Validation] Response is JSON, expected XML. The API might have changed or returned an error JSON.");
    } else if (xmlText.trim().startsWith('<')) {
        console.log("[NLK Validation] Response looks like XML.");
    } else {
        console.warn("[NLK Validation] Unknown response format.");
    }

    // Check for common error signatures
    if (xmlText.includes('<error_code>') || xmlText.includes('<message>')) {
        console.warn("[NLK Validation] API returned an explicit error message in XML.");
        return false;
    }
    
    // Try Parsing
    try {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlText, "text/xml");
        const parseError = xmlDoc.getElementsByTagName("parsererror");
        if (parseError.length > 0) {
            console.error("[NLK Validation] XML Parsing Error:", parseError[0].textContent);
            return false;
        }
        
        // Check for success content
        const totalCount = xmlDoc.getElementsByTagName('totalCount');
        const list = xmlDoc.getElementsByTagName('list');
        
        console.log(`[NLK Validation] Found <totalCount>: ${totalCount.length > 0}`);
        console.log(`[NLK Validation] Found <list>: ${list.length > 0}`);

        if (totalCount.length > 0 || list.length > 0) return true;

    } catch (parseEx) {
        console.error("[NLK Validation] Exception during parsing:", parseEx);
    }
    
    return false;
  } catch (error) {
    console.error("[NLK Validation] Network/System Error:", error);
    return false;
  }
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mapAladinItemToBook = (item: any): Book => ({
  id: String(item.itemId),
  title: item.title,
  author: item.author,
  publisher: item.publisher,
  pubDate: item.pubDate,
  cover: item.cover,
  description: item.description || '',
  isbn13: item.isbn13,
  priceStandard: item.priceStandard,
  priceSales: item.priceSales,
  link: item.link,
  categoryName: item.categoryName,
  status: 'discovery'
});

const isWithinOneYear = (dateStr: string): boolean => {
  if (!dateStr) return false;
  const pubDate = new Date(dateStr);
  if (isNaN(pubDate.getTime())) return true; // Keep if date is invalid to be safe
  
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
  
  return pubDate >= oneYearAgo;
};

// Filter function to exclude comics
const isNotComic = (book: Book): boolean => {
  if (!book.categoryName) return true;
  return !book.categoryName.includes('만화');
};

const getElementText = (element: Element, tagName: string): string => {
  const found = element.getElementsByTagName(tagName);
  return found.length > 0 ? found[0].textContent || '' : '';
};

export const searchBooks = async (query: string, ttbKey: string, target: SearchTarget = 'Keyword', page: number = 1): Promise<Book[]> => {
  if (!query || !ttbKey) return [];
  const cleanKey = ttbKey.trim();
  
  // Added timestamp to prevent caching search results
  // Use the 'target' parameter for QueryType (Keyword, Title, Author, Publisher)
  const aladinUrl = `https://www.aladin.co.kr/ttb/api/ItemSearch.aspx?ttbkey=${cleanKey}&Query=${encodeURIComponent(query)}&QueryType=${target}&MaxResults=50&start=${page}&SearchTarget=Book&output=js&Version=20131101&Cover=Big&_t=${Date.now()}`;

  try {
    const data = await fetchWithRetry(aladinUrl);
    if (data.errorCode) throw new Error(`Aladin Search Error: ${data.errorMessage || data.errorCode}`);
    if (!data.item || !Array.isArray(data.item)) return [];
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const books = data.item.map(mapAladinItemToBook);
    return books
      .filter((book: Book) => isWithinOneYear(book.pubDate))
      .filter(isNotComic); // Exclude comics
  } catch (error) {
    console.error("Search failed", error);
    throw error;
  }
};

export const fetchBooks = async (source: FetchSource, ttbKey?: string, nlkKey?: string, page: number = 1): Promise<Book[]> => {
  try {
    // 1. National Library of Korea (Librarian Recommendation)
    if (source === 'editorRecommend') {
      if (!nlkKey) throw new Error("국립중앙도서관 API 키가 필요합니다.");
      const cleanKey = nlkKey.trim();
      
      const startRow = (page - 1) * 50 + 1;
      const endRow = page * 50;
      
      // Use saseoApi.do as per PDF
      // Corrected URL syntax: ?key=...&startRowNumApi=...
      const nlkUrl = `https://nl.go.kr/NL/search/openApi/saseoApi.do?key=${cleanKey}&startRowNumApi=${startRow}&endRowNumApi=${endRow}`;
      
      const xmlText = await fetchWithRetry(nlkUrl, false);
      
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlText, "text/xml");
      
      const items = xmlDoc.getElementsByTagName('item');
      const books: Book[] = [];
      
      for(let i = 0; i < items.length; i++) {
        const item = items[i];
        
        // Extract basic fields
        const title = getElementText(item, 'recomtitle');
        const author = getElementText(item, 'recomauthor');
        const publisher = getElementText(item, 'recompublisher');
        const pubYear = getElementText(item, 'publishYear'); // PDF says publishYear
        const cover = getElementText(item, 'recomfilepath'); // PDF says recomfilepath for image path
        const description = getElementText(item, 'recomcontents'); // PDF says recomcontents for contents
        const isbnMulti = getElementText(item, 'recomisbn'); // Space separated
        const isbn13 = isbnMulti.split(' ')[0] || '';
        const drCodeName = getElementText(item, 'drCodeName');
        const recomNo = getElementText(item, 'recomNo');

        // Fix potential encoding issues or HTML entities in description
        const cleanDesc = description.replace(/<[^>]*>?/gm, '');

        books.push({
          id: `nlk-${recomNo || i}`,
          title: title,
          author: author,
          publisher: publisher,
          pubDate: pubYear,
          cover: cover,
          description: cleanDesc,
          isbn13: isbn13,
          priceStandard: 0, // Not provided in this API
          priceSales: 0,    // Not provided in this API
          link: '',
          categoryName: drCodeName,
          status: 'discovery'
        });
      }
      
      return books;
    }

    // Aladin Logic
    if (!ttbKey) return [];
    const cleanKey = ttbKey.trim();
    // Added timestamp to commonParams
    const commonParams = `ttbkey=${cleanKey}&MaxResults=50&start=${page}&SearchTarget=Book&output=js&Version=20131101&Cover=Big&_t=${Date.now()}`;

    let books: Book[] = [];

    // 2. Aladin Bestseller Only
    if (source === 'bestseller') {
      const url = `https://www.aladin.co.kr/ttb/api/ItemList.aspx?${commonParams}&QueryType=Bestseller`;
      const data = await fetchWithRetry(url);
      if (data.errorCode) throw new Error(`Aladin Error: ${data.errorMessage}`);
      books = Array.isArray(data.item) ? data.item.map(mapAladinItemToBook) : [];
    }

    // 3. Aladin New Special (Mapped as "Steady Seller" / Noteworthy New)
    else if (source === 'itemNewSpecial') {
      const url = `https://www.aladin.co.kr/ttb/api/ItemList.aspx?${commonParams}&QueryType=ItemNewSpecial`;
      const data = await fetchWithRetry(url);
      if (data.errorCode) throw new Error(`Aladin Error: ${data.errorMessage}`);
      books = Array.isArray(data.item) ? data.item.map(mapAladinItemToBook) : [];
    }

    // 4. Combined (Bestseller 50 + ItemNewSpecial 50)
    else if (source === 'combined') {
      const bestsellerUrl = `https://www.aladin.co.kr/ttb/api/ItemList.aspx?${commonParams}&QueryType=Bestseller`;
      const newSpecialUrl = `https://www.aladin.co.kr/ttb/api/ItemList.aspx?${commonParams}&QueryType=ItemNewSpecial`;

      const [bestsellerData, newSpecialData] = await Promise.all([
        fetchWithRetry(bestsellerUrl),
        fetchWithRetry(newSpecialUrl)
      ]);

      if (bestsellerData.errorCode) throw new Error(`Aladin Bestseller Error: ${bestsellerData.errorMessage}`);
      if (newSpecialData.errorCode) throw new Error(`Aladin NewSpecial Error: ${newSpecialData.errorMessage}`);

      const bestsellers = Array.isArray(bestsellerData.item) ? bestsellerData.item.map(mapAladinItemToBook) : [];
      const newSpecials = Array.isArray(newSpecialData.item) ? newSpecialData.item.map(mapAladinItemToBook) : [];

      // Merge and deduplicate by ID
      const combined = [...bestsellers, ...newSpecials];
      const uniqueBooks = Array.from(new Map(combined.map(item => [item.id, item])).values());
      
      books = uniqueBooks;
    }

    // Apply comic filter to all Aladin results
    return books.filter(isNotComic);

  } catch (error) {
    console.error("Fetching books failed", error);
    throw error;
  }
};
