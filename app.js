/**
 * FlashGyaan - GRE Vocabulary Learning Application
 * Main application file handling the Vue.js application logic
 * 
 * Features:
 * - Word flashcards with definitions, pronunciations, and examples
 * - Interactive quiz system with multiple choice questions
 * - Smart search with autocomplete and keyboard navigation
 * - Progress tracking and word navigation
 * - Offline support using IndexedDB
 * - Touch gestures for mobile devices
 * - Performance optimizations and caching
 */

const { createApp } = Vue;

// Utility functions
const debounce = (fn, delay) => {
    let timeoutId;
    return (...args) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => fn(...args), delay);
    };
};

const shuffleArray = (array) => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
};

const app = createApp({
    /**
     * Application state data
     * @returns {Object} Vue data object
     */
    data() {
        return {
            words: [],              // Array of all vocabulary words
            currentIndex: 0,        // Current word index being displayed
            searchQuery: '',        // Current search term
            showRecommendations: false,  // Whether to show search recommendations
            selectedIndex: -1,      // Currently selected item in autocomplete (-1 means none selected)
            showQuiz: false,       // Whether quiz mode is active
            quizQuestion: '',      // Current quiz question
            quizOptions: [],       // Multiple choice options for current question
            quizResult: '',        // Result of the current quiz answer
            streak: 0,             // Number of correct answers in a row
            cardEnter: false,      // Card enter animation state
            cardExit: false,       // Card exit animation state
            touchStartX: 0,        // Touch gesture start position
            touchEndX: 0,          // Touch gesture end position
            isLoading: true,       // Loading state indicator
            error: null,           // Error state message
            loadedWordCount: 0,    // Number of words loaded
            quizQuestions: [],     // Array of generated quiz questions
            currentQuizIndex: 0,   // Current quiz question index
            searchTimeout: null,   // Timeout for search debouncing
            wordCache: new Map(),  // Cache for word data
            lastSearchQuery: '',  // Last search query for caching
            lastSearchResults: [] // Last search results for caching
        }
    },

    /**
     * Computed properties for derived state
     */
    computed: {
        /**
         * Get the currently displayed word
         * @returns {Object|null} Current word object or null if none available
         */
        currentWord() {
            if (this.isLoading || !this.words.length) return null;
            return this.words[this.currentIndex] || null;
        },

        /**
         * Get filtered words based on search query
         * @returns {Array} Filtered word objects
         */
        filteredWords() {
            if (!this.searchQuery || this.isLoading) return [];
            
            // Check cache first
            if (this.lastSearchQuery === this.searchQuery) {
                return this.lastSearchResults;
            }
            
            const query = this.searchQuery.toLowerCase();
            const results = this.words.filter(word => 
                word.word.toLowerCase().includes(query) ||
                word.definition.toLowerCase().includes(query)
            );
            
            // Update cache
            this.lastSearchQuery = this.searchQuery;
            this.lastSearchResults = results;
            
            return results;
        }
    },

    methods: {
        /**
         * Initialize the application by loading words
         * Attempts to load from IndexedDB first, falls back to word list files
         */
        async initializeApp() {
            try {
                this.isLoading = true;
                this.error = null;
                this.loadedWordCount = 0;
                
                // Try to load from IndexedDB first
                const cachedWords = await dbOperations.getWords();
                if (cachedWords && cachedWords.length > 0) {
                    this.words = cachedWords;
                    this.loadedWordCount = cachedWords.length;
                    this.isLoading = false;
                    return;
                }

                // If no cached data, collect words from preloaded word lists
                const allWords = [];
                for (let i = 0; i < 26; i++) {
                    const letter = String.fromCharCode(65 + i); // A to Z
                    const words = window[`${letter}_WORDS`];
                    if (words && Array.isArray(words)) {
                        console.log(`Loaded ${words.length} words from ${letter}-words.js`);
                        allWords.push(...words);
                        this.loadedWordCount += words.length;
                    }
                }

                if (allWords.length === 0) {
                    throw new Error('No words were loaded');
                }

                // Sort words alphabetically
                allWords.sort((a, b) => a.word.localeCompare(b.word));
                
                // Set the words array
                this.words = allWords;
                
                // Cache the words in IndexedDB
                await dbOperations.saveWords(this.words);
                
                this.isLoading = false;
            } catch (error) {
                console.error('Error initializing app:', error);
                this.error = error.message;
                this.isLoading = false;
            }
        },

        /**
         * Handle search input and show recommendations
         * Updates the UI to show/hide autocomplete suggestions
         * and resets the selected index when input changes
         */
        handleSearch: debounce(function() {
            this.showRecommendations = this.searchQuery.length > 0;
            this.selectedIndex = -1;
        }, 300),

        /**
         * Handle keyboard navigation in the autocomplete dropdown
         * Supports:
         * - Arrow Up/Down: Navigate through suggestions
         * - Enter: Select current suggestion
         * - Escape: Close suggestions
         * @param {KeyboardEvent} event - Keyboard event
         */
        handleKeydown(event) {
            if (!this.showRecommendations) return;
            
            switch(event.key) {
                case 'ArrowDown':
                    event.preventDefault();
                    this.selectedIndex = Math.min(this.selectedIndex + 1, this.filteredWords.length - 1);
                    break;
                case 'ArrowUp':
                    event.preventDefault();
                    this.selectedIndex = Math.max(this.selectedIndex - 1, -1);
                    break;
                case 'Enter':
                    event.preventDefault();
                    if (this.selectedIndex >= 0) {
                        this.goToWord(this.filteredWords[this.selectedIndex]);
                    }
                    break;
                case 'Escape':
                    this.showRecommendations = false;
                    break;
            }
        },

        /**
         * Navigate to a specific word and reset search state
         * @param {Object} word - Word object to navigate to
         */
        goToWord(word) {
            const index = this.words.findIndex(w => w.word === word.word);
            if (index !== -1) {
                this.currentIndex = index;
                this.searchQuery = '';
                this.showRecommendations = false;
                this.selectedIndex = -1;
                this.lastSearchQuery = '';
                this.lastSearchResults = [];
            }
        },

        /**
         * Toggle quiz mode and generate new questions
         */
        toggleQuiz() {
            this.showQuiz = !this.showQuiz;
            if (this.showQuiz) {
                this.generateQuiz();
            } else {
                this.quizResult = '';
            }
        },

        /**
         * Generate a set of 5 random quiz questions
         */
        generateQuiz() {
            // Generate 5 random questions from the entire word list
            const questions = [];
            const usedIndices = new Set();
            
            while (questions.length < 5) {
                const randomIndex = Math.floor(Math.random() * this.words.length);
                if (!usedIndices.has(randomIndex)) {
                    usedIndices.add(randomIndex);
                    const word = this.words[randomIndex];
                    const questionTypes = [
                        {
                            type: 'definition',
                            question: `What is the definition of "${word.word}"?`,
                            correct: word.definition,
                            generateOptions: () => {
                                const options = [word.definition];
                                const otherWords = this.words.filter(w => w.word !== word.word);
                                while (options.length < 4) {
                                    const randomWord = otherWords[Math.floor(Math.random() * otherWords.length)];
                                    if (!options.includes(randomWord.definition)) {
                                        options.push(randomWord.definition);
                                    }
                                }
                                return shuffleArray(options);
                            }
                        },
                        {
                            type: 'word',
                            question: `What word means "${word.definition}"?`,
                            correct: word.word,
                            generateOptions: () => {
                                const options = [word.word];
                                const otherWords = this.words.filter(w => w.word !== word.word);
                                while (options.length < 4) {
                                    const randomWord = otherWords[Math.floor(Math.random() * otherWords.length)];
                                    if (!options.includes(randomWord.word)) {
                                        options.push(randomWord.word);
                                    }
                                }
                                return shuffleArray(options);
                            }
                        }
                    ];
                    
                    const questionType = questionTypes[Math.floor(Math.random() * questionTypes.length)];
                    questions.push({
                        ...questionType,
                        options: questionType.generateOptions()
                    });
                }
            }
            
            this.quizQuestions = questions;
            this.currentQuizIndex = 0;
            this.showCurrentQuestion();
        },

        showCurrentQuestion() {
            if (this.currentQuizIndex < this.quizQuestions.length) {
                const question = this.quizQuestions[this.currentQuizIndex];
                this.quizQuestion = question.question;
                this.quizOptions = question.options;
                this.quizResult = '';
            } else {
                this.showQuiz = false;
            }
        },

        /**
         * Check the answer for the current quiz question
         * @param {string} selected - The selected answer
         */
        checkAnswer(selected) {
            const question = this.quizQuestions[this.currentQuizIndex];
            if (selected === question.correct) {
                this.quizResult = 'Correct!';
                this.streak++;
            } else {
                this.quizResult = `Incorrect. The correct answer is: ${question.correct}`;
                this.streak = 0;
            }
            
            setTimeout(() => {
                this.currentQuizIndex++;
                this.showCurrentQuestion();
            }, 1500);
        },

        /**
         * Touch event handlers for swipe gestures
         */
        touchStart(event) {
            this.touchStartX = event.touches[0].clientX;
        },

        touchMove(event) {
            this.touchEndX = event.touches[0].clientX;
        },

        touchEnd() {
            const swipeDistance = this.touchEndX - this.touchStartX;
            const minSwipeDistance = 50;
            
            if (Math.abs(swipeDistance) > minSwipeDistance) {
                if (swipeDistance > 0) {
                    this.previousWord();
                } else {
                    this.nextWord();
                }
            }
            
            this.touchStartX = 0;
            this.touchEndX = 0;
        },

        /**
         * Navigate to the next word with animation
         */
        nextWord() {
            if (this.currentIndex < this.words.length - 1) {
                this.cardExit = true;
                setTimeout(() => {
                    this.currentIndex++;
                    this.cardExit = false;
                    this.cardEnter = true;
                    setTimeout(() => {
                        this.cardEnter = false;
                    }, 300);
                }, 300);
            }
        },

        /**
         * Navigate to the previous word with animation
         */
        previousWord() {
            if (this.currentIndex > 0) {
                this.cardExit = true;
                setTimeout(() => {
                    this.currentIndex--;
                    this.cardExit = false;
                    this.cardEnter = true;
                    setTimeout(() => {
                        this.cardEnter = false;
                    }, 300);
                }, 300);
            }
        }
    },

    /**
     * Lifecycle hook: Called after the instance is mounted
     */
    async mounted() {
        await this.initializeApp();
        // Initialize Hammer.js for swipe gestures after the DOM is updated
        this.$nextTick(() => {
            const card = this.$refs.card;
            if (card) {
                const hammer = new Hammer(card);
                hammer.on('swipeleft', () => this.nextWord());
                hammer.on('swiperight', () => this.previousWord());
            }
        });
    }
});

// Mount the Vue application
app.mount('#app'); 