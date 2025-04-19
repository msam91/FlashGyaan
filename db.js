/**
 * FlashGyaan - IndexedDB Operations Module
 * 
 * This module handles all database operations for the FlashGyaan application.
 * It provides functionality for:
 * - Database initialization
 * - Word storage and retrieval
 * - Word searching
 * - Data compression for efficient storage
 * - Batch operations for better performance
 * - Improved error handling
 */

// Constants
const DB_NAME = 'greWordsDB';
const STORE_NAME = 'words';
const DB_VERSION = 1;
const BATCH_SIZE = 100; // Number of words to process in each batch

// Compression utilities with memoization
const compressWord = (() => {
    const cache = new Map();
    return (word) => {
        const key = word.word;
        if (cache.has(key)) return cache.get(key);
        
        const compressed = {
            w: word.word,                    // word
            p: word.pronunciation,           // pronunciation
            ps: word.partOfSpeech,           // part of speech
            d: word.definition,              // definition
            e: word.example                  // example
        };
        cache.set(key, compressed);
        return compressed;
    };
})();

const decompressWord = (() => {
    const cache = new Map();
    return (compressed) => {
        const key = compressed.w;
        if (cache.has(key)) return cache.get(key);
        
        const decompressed = {
            word: compressed.w,
            pronunciation: compressed.p,
            partOfSpeech: compressed.ps,
            definition: compressed.d,
            example: compressed.e
        };
        cache.set(key, decompressed);
        return decompressed;
    };
})();

// Database operations with improved error handling and caching
const dbOperations = {
    _db: null,
    _cache: new Map(),
    
    /**
     * Initialize the database connection with caching
     * @returns {Promise<IDBDatabase>} Database connection
     */
    async initDB() {
        if (this._db) return this._db;
        
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);
            
            request.onerror = () => {
                console.error('Database error:', request.error);
                reject(request.error);
            };
            
            request.onsuccess = () => {
                this._db = request.result;
                resolve(this._db);
            };
            
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    const store = db.createObjectStore(STORE_NAME, { keyPath: 'w' });
                    store.createIndex('search', 'w', { unique: false });
                }
            };
        });
    },
    
    /**
     * Save words to the database in batches
     * @param {Array} words - Array of word objects to save
     * @returns {Promise<void>}
     */
    async saveWords(words) {
        try {
            const db = await this.initDB();
            const tx = db.transaction(STORE_NAME, 'readwrite');
            const store = tx.objectStore(STORE_NAME);
            
            // Clear existing data
            await new Promise((resolve, reject) => {
                const clearRequest = store.clear();
                clearRequest.onsuccess = () => resolve();
                clearRequest.onerror = () => reject(clearRequest.error);
            });
            
            // Process words in batches
            const compressedWords = words.map(compressWord);
            for (let i = 0; i < compressedWords.length; i += BATCH_SIZE) {
                const batch = compressedWords.slice(i, i + BATCH_SIZE);
                await Promise.all(batch.map(word => 
                    new Promise((resolve, reject) => {
                        const request = store.add(word);
                        request.onsuccess = () => resolve();
                        request.onerror = () => reject(request.error);
                    })
                ));
            }
            
            // Clear cache after successful save
            this._cache.clear();
            
            return new Promise((resolve, reject) => {
                tx.oncomplete = () => resolve();
                tx.onerror = () => reject(tx.error);
            });
        } catch (error) {
            console.error('Error saving words:', error);
            throw error;
        }
    },
    
    /**
     * Retrieve all words from the database with caching
     * @returns {Promise<Array>} Array of word objects
     */
    async getWords() {
        try {
            // Check cache first
            if (this._cache.has('all_words')) {
                return this._cache.get('all_words');
            }
            
            const db = await this.initDB();
            const tx = db.transaction(STORE_NAME, 'readonly');
            const store = tx.objectStore(STORE_NAME);
            
            const words = await new Promise((resolve, reject) => {
                const request = store.getAll();
                request.onsuccess = () => {
                    const compressedWords = request.result;
                    const words = compressedWords.map(decompressWord);
                    resolve(words);
                };
                request.onerror = () => reject(request.error);
            });
            
            // Cache the result
            this._cache.set('all_words', words);
            return words;
        } catch (error) {
            console.error('Error getting words:', error);
            throw error;
        }
    },
    
    /**
     * Search for words in the database with improved performance
     * @param {string} query - Search query
     * @returns {Promise<Array>} Array of matching word objects
     */
    async searchWords(query) {
        try {
            const normalizedQuery = query.toLowerCase();
            
            // Check cache first
            const cacheKey = `search_${normalizedQuery}`;
            if (this._cache.has(cacheKey)) {
                return this._cache.get(cacheKey);
            }
            
            const db = await this.initDB();
            const tx = db.transaction(STORE_NAME, 'readonly');
            const store = tx.objectStore(STORE_NAME);
            
            const words = await new Promise((resolve, reject) => {
                const request = store.getAll();
                request.onsuccess = () => {
                    const compressedWords = request.result;
                    const words = compressedWords
                        .map(decompressWord)
                        .filter(word => 
                            word.word.toLowerCase().includes(normalizedQuery) ||
                            word.definition.toLowerCase().includes(normalizedQuery)
                        )
                        .slice(0, 5);
                    resolve(words);
                };
                request.onerror = () => reject(request.error);
            });
            
            // Cache the result
            this._cache.set(cacheKey, words);
            return words;
        } catch (error) {
            console.error('Error searching words:', error);
            throw error;
        }
    },
    
    /**
     * Clear the database cache
     */
    clearCache() {
        this._cache.clear();
    }
};

// Export the database operations
window.dbOperations = dbOperations; 