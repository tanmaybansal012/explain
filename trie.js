/**
 * TRIE — Ticker Symbol Autocomplete
 *
 * A Trie (prefix tree) stores strings by their prefixes.
 * Each node represents one character. Searching for a prefix
 * traverses only the matching branch — O(m) where m = prefix length,
 * regardless of how many tickers are stored.
 *
 * Why not SQL LIKE '%query%'? That's O(n·m) — full table scan.
 * Why not JS Array.filter? Same — O(n·m).
 * Trie: O(m) lookup + O(k) to collect k results. Far better.
 *
 * In production: serialize the Trie to Redis on startup,
 * reload it when new tickers are added.
 */

class TrieNode {
  constructor() {
    this.children = {};     // char → TrieNode
    this.isEnd    = false;  // marks complete ticker
    this.metadata = null;   // store company name, sector, etc.
  }
}

class Trie {
  constructor() {
    this.root = new TrieNode();
    this.size = 0;
  }

  /**
   * Insert a ticker (and optional metadata) into the Trie.
   * Time: O(m) where m = ticker length
   */
  insert(ticker, metadata = {}) {
    let node = this.root;
    for (const char of ticker.toUpperCase()) {
      if (!node.children[char]) {
        node.children[char] = new TrieNode();
      }
      node = node.children[char];
    }
    if (!node.isEnd) this.size++;
    node.isEnd    = true;
    node.metadata = { ticker: ticker.toUpperCase(), ...metadata };
  }

  /**
   * Search for exact ticker.
   * Time: O(m)
   */
  search(ticker) {
    const node = this._traverse(ticker.toUpperCase());
    return node && node.isEnd ? node.metadata : null;
  }

  /**
   * Check if any ticker starts with this prefix.
   * Time: O(m)
   */
  startsWith(prefix) {
    return this._traverse(prefix.toUpperCase()) !== null;
  }

  /**
   * Return all tickers matching a prefix (autocomplete).
   * Time: O(m + k) where k = number of results
   *
   * @param {string} prefix
   * @param {number} limit   - max results to return
   */
  autocomplete(prefix, limit = 10) {
    const node = this._traverse(prefix.toUpperCase());
    if (!node) return [];

    const results = [];
    this._dfs(node, results, limit);
    return results;
  }

  /**
   * Delete a ticker from the Trie.
   * Time: O(m)
   */
  delete(ticker) {
    this._delete(this.root, ticker.toUpperCase(), 0);
  }

  // ─── Private helpers ───────────────────────────────────────────────────────

  _traverse(str) {
    let node = this.root;
    for (const char of str) {
      if (!node.children[char]) return null;
      node = node.children[char];
    }
    return node;
  }

  _dfs(node, results, limit) {
    if (results.length >= limit) return;
    if (node.isEnd) results.push(node.metadata);
    for (const char of Object.keys(node.children).sort()) {
      this._dfs(node.children[char], results, limit);
    }
  }

  _delete(node, str, depth) {
    if (!node) return false;
    if (depth === str.length) {
      if (node.isEnd) { node.isEnd = false; this.size--; }
      return Object.keys(node.children).length === 0;
    }
    const char  = str[depth];
    const child = node.children[char];
    if (!child) return false;

    const shouldDelete = this._delete(child, str, depth + 1);
    if (shouldDelete) {
      delete node.children[char];
      return !node.isEnd && Object.keys(node.children).length === 0;
    }
    return false;
  }

  /**
   * Serialize to plain object for Redis storage.
   */
  toJSON() {
    return JSON.stringify({ root: this.root, size: this.size });
  }

  /**
   * Rebuild from serialized JSON.
   */
  static fromJSON(json) {
    const trie = new Trie();
    const data = JSON.parse(json);
    trie.root = data.root;
    trie.size = data.size;
    return trie;
  }
}

// ─── Singleton Trie pre-loaded with common tickers ───────────────────────────
const COMMON_TICKERS = [
  { ticker: 'AAPL',  name: 'Apple Inc.',                sector: 'Technology' },
  { ticker: 'MSFT',  name: 'Microsoft Corp.',           sector: 'Technology' },
  { ticker: 'GOOGL', name: 'Alphabet Inc.',             sector: 'Technology' },
  { ticker: 'AMZN',  name: 'Amazon.com Inc.',           sector: 'Consumer Cyclical' },
  { ticker: 'TSLA',  name: 'Tesla Inc.',                sector: 'Automotive' },
  { ticker: 'NVDA',  name: 'NVIDIA Corp.',              sector: 'Technology' },
  { ticker: 'META',  name: 'Meta Platforms Inc.',       sector: 'Technology' },
  { ticker: 'NFLX',  name: 'Netflix Inc.',              sector: 'Communication' },
  { ticker: 'JPM',   name: 'JPMorgan Chase & Co.',      sector: 'Financials' },
  { ticker: 'JNJ',   name: 'Johnson & Johnson',         sector: 'Healthcare' },
  { ticker: 'V',     name: 'Visa Inc.',                 sector: 'Financials' },
  { ticker: 'PG',    name: 'Procter & Gamble Co.',      sector: 'Consumer Staples' },
  { ticker: 'KO',    name: 'Coca-Cola Co.',             sector: 'Consumer Staples' },
  { ticker: 'DIS',   name: 'Walt Disney Co.',           sector: 'Communication' },
  { ticker: 'BABA',  name: 'Alibaba Group',             sector: 'Consumer Cyclical' },
  { ticker: 'WMT',   name: 'Walmart Inc.',              sector: 'Consumer Staples' },
  { ticker: 'BAC',   name: 'Bank of America Corp.',     sector: 'Financials' },
  { ticker: 'XOM',   name: 'Exxon Mobil Corp.',         sector: 'Energy' },
  { ticker: 'INTC',  name: 'Intel Corp.',               sector: 'Technology' },
  { ticker: 'AMD',   name: 'Advanced Micro Devices',    sector: 'Technology' },
];

const globalTrie = new Trie();
COMMON_TICKERS.forEach(({ ticker, name, sector }) =>
  globalTrie.insert(ticker, { name, sector })
);


const INDIAN_TICKERS = [
  { ticker: 'RELIANCE', name: 'Reliance Industries',    sector: 'Energy' },
  { ticker: 'TCS',      name: 'Tata Consultancy Svcs',  sector: 'Technology' },
  { ticker: 'INFY',     name: 'Infosys Ltd',            sector: 'Technology' },
  { ticker: 'HDFCBANK', name: 'HDFC Bank',              sector: 'Financials' },
  { ticker: 'WIPRO',    name: 'Wipro Ltd',              sector: 'Technology' },
  { ticker: 'TATAMOTORS',name: 'Tata Motors',           sector: 'Automotive' },
  { ticker: 'BAJFINANCE',name: 'Bajaj Finance',         sector: 'Financials' },
  { ticker: 'ADANIENT', name: 'Adani Enterprises',      sector: 'Conglomerate' },
  { ticker: 'ICICIBANK',name: 'ICICI Bank',             sector: 'Financials' },
  { ticker: 'SBIN',     name: 'State Bank of India',    sector: 'Financials' },
];

INDIAN_TICKERS.forEach(({ ticker, name, sector }) =>
  globalTrie.insert(ticker, { name, sector })
);

module.exports = { Trie, globalTrie, COMMON_TICKERS, INDIAN_TICKERS };  