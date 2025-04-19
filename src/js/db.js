/**
 * FlashGyaan - IndexedDB Operations Module
 * 
 * This module handles all database operations for the FlashGyaan application.
 * It provides functionality for:
 * - Database initialization
 * - Word storage and retrieval
 * - Word searching
 * - Data compression for efficient storage
 */

// Compression utilities
const compressWord = (word) => {
    // Simple compression by removing common words and shortening definitions
    return {
        w: word.word,                    // word
        p: word.pronunciation,           // pronunciation
        ps: word.partOfSpeech,           // part of speech
        d: word.definition,              // definition
        e: word.example                  // example
    }
}

const decompressWord = (compressed) => {
    return {
        word: compressed.w,
        pronunciation: compressed.p,
        partOfSpeech: compressed.ps,
        definition: compressed.d,
        example: compressed.e
    }
}

// IndexedDB setup
const dbName = 'greWordsDB'
const storeName = 'words'
const dbVersion = 1

const initDB = () => {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(dbName, dbVersion)

        request.onerror = () => reject(request.error)
        request.onsuccess = () => resolve(request.result)

        request.onupgradeneeded = (event) => {
            const db = event.target.result
            if (!db.objectStoreNames.contains(storeName)) {
                const store = db.createObjectStore(storeName, { keyPath: 'w' })
                store.createIndex('search', 'w', { unique: false })
            }
        }
    })
}

// Database operations
const dbOperations = {
    /**
     * Initialize the database connection
     * @returns {Promise<IDBDatabase>} Database connection
     */
    async initDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(dbName, dbVersion)

            request.onerror = () => reject(request.error)
            request.onsuccess = () => resolve(request.result)

            request.onupgradeneeded = (event) => {
                const db = event.target.result
                if (!db.objectStoreNames.contains(storeName)) {
                    const store = db.createObjectStore(storeName, { keyPath: 'w' })
                    store.createIndex('search', 'w', { unique: false })
                }
            }
        })
    },

    /**
     * Save words to the database
     * @param {Array} words - Array of word objects to save
     * @returns {Promise<void>}
     */
    async saveWords(words) {
        const db = await this.initDB()
        const tx = db.transaction(storeName, 'readwrite')
        const store = tx.objectStore(storeName)

        // Clear existing data
        await new Promise((resolve, reject) => {
            const clearRequest = store.clear()
            clearRequest.onsuccess = () => resolve()
            clearRequest.onerror = () => reject(clearRequest.error)
        })

        // Save compressed words
        const compressedWords = words.map(compressWord)
        for (const word of compressedWords) {
            await new Promise((resolve, reject) => {
                const request = store.add(word)
                request.onsuccess = () => resolve()
                request.onerror = () => reject(request.error)
            })
        }

        return new Promise((resolve, reject) => {
            tx.oncomplete = () => resolve()
            tx.onerror = () => reject(tx.error)
        })
    },

    /**
     * Retrieve all words from the database
     * @returns {Promise<Array>} Array of word objects
     */
    async getWords() {
        const db = await this.initDB()
        const tx = db.transaction(storeName, 'readonly')
        const store = tx.objectStore(storeName)

        return new Promise((resolve, reject) => {
            const request = store.getAll()
            request.onsuccess = () => {
                const compressedWords = request.result
                const words = compressedWords.map(decompressWord)
                resolve(words)
            }
            request.onerror = () => reject(request.error)
        })
    },

    /**
     * Search for words in the database
     * @param {string} query - Search query
     * @returns {Promise<Array>} Array of matching word objects
     */
    async searchWords(query) {
        const db = await this.initDB()
        const tx = db.transaction(storeName, 'readonly')
        const store = tx.objectStore(storeName)
        const index = store.index('search')

        return new Promise((resolve, reject) => {
            const request = index.getAll()
            request.onsuccess = () => {
                const compressedWords = request.result
                const words = compressedWords
                    .map(decompressWord)
                    .filter(word => 
                        word.word.toLowerCase().includes(query.toLowerCase()) ||
                        word.definition.toLowerCase().includes(query.toLowerCase())
                    )
                    .slice(0, 5)
                resolve(words)
            }
            request.onerror = () => reject(request.error)
        })
    }
}

// Export the database operations
window.dbOperations = dbOperations 