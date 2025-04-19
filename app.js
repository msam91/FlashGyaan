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
 */

const { createApp } = Vue;

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
            currentQuizIndex: 0    // Current quiz question index
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
            const query = this.searchQuery.toLowerCase();
            return this.words.filter(word => 
                word.word.toLowerCase().includes(query) ||
                word.definition.toLowerCase().includes(query)
            );
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

                // If no cached data, load from word lists
                const wordLists = [
                    'a-words', 'b-words', 'c-words', 'd-words', 'e-words',
                    'f-words', 'g-words', 'h-words', 'i-words', 'j-words',
                    'k-words', 'l-words', 'm-words', 'n-words', 'o-words',
                    'p-words', 'q-words', 'r-words', 's-words', 't-words',
                    'u-words', 'v-words', 'w-words', 'x-words', 'y-words',
                    'z-words'
                ];

                const allWords = [];
                for (const list of wordLists) {
                    try {
                        const response = await fetch(`config/word-lists/${list}.js`);
                        if (!response.ok) {
                            console.error(`Failed to load ${list}: ${response.status} ${response.statusText}`);
                            continue;
                        }
                        const text = await response.text();
                        
                        // Create a script element to load the word list
                        const script = document.createElement('script');
                        script.textContent = text;
                        document.head.appendChild(script);
                        
                        // Get the words from the window object
                        const letter = list.charAt(0).toUpperCase();
                        const words = window[`${letter}_WORDS`];
                        if (words && Array.isArray(words)) {
                            console.log(`Loaded ${words.length} words from ${list}`);
                            allWords.push(...words);
                            this.loadedWordCount += words.length;
                        } else {
                            console.error(`No words found in ${list}`);
                        }
                        
                        // Clean up
                        document.head.removeChild(script);
                        delete window[`${letter}_WORDS`];
                    } catch (error) {
                        console.error(`Error loading ${list}:`, error);
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
        handleSearch() {
            this.showRecommendations = this.searchQuery.length > 0;
            this.selectedIndex = -1;
        },

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
                                return this.shuffleArray(options);
                            }
                        },
                        {
                            type: 'usage',
                            question: `Complete the sentence: "${word.example.replace(word.word, '_____')}"`,
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
                                return this.shuffleArray(options);
                            }
                        }
                    ];
                    const selectedType = questionTypes[Math.floor(Math.random() * questionTypes.length)];
                    questions.push({
                        word: word,
                        question: selectedType.question,
                        options: selectedType.generateOptions(),
                        correct: selectedType.correct
                    });
                }
            }
            
            this.quizQuestions = questions;
            this.currentQuizIndex = 0;
            this.quizQuestion = questions[0].question;
            this.quizOptions = questions[0].options;
            this.quizResult = '';
        },

        /**
         * Check the answer for the current quiz question
         * @param {string} selected - The selected answer
         */
        checkAnswer(selected) {
            const currentQuestion = this.quizQuestions[this.currentQuizIndex];
            const isCorrect = selected === currentQuestion.correct;
            this.quizResult = isCorrect ? 'Correct!' : 'Try again!';
            
            if (isCorrect) {
                setTimeout(() => {
                    if (this.currentQuizIndex < this.quizQuestions.length - 1) {
                        this.currentQuizIndex++;
                        this.quizQuestion = this.quizQuestions[this.currentQuizIndex].question;
                        this.quizOptions = this.quizQuestions[this.currentQuizIndex].options;
                        this.quizResult = '';
                    } else {
                        this.showQuiz = false;
                        this.generateQuiz(); // Prepare next set of questions
                    }
                }, 1500);
            }
        },

        /**
         * Shuffle an array randomly
         * @param {Array} array - The array to shuffle
         * @returns {Array} The shuffled array
         */
        shuffleArray(array) {
            for (let i = array.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [array[i], array[j]] = [array[j], array[i]];
            }
            return array;
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
            if (Math.abs(swipeDistance) > 50) {
                if (swipeDistance > 0) {
                    this.previousWord();
                } else {
                    this.nextWord();
                }
            }
        },

        /**
         * Navigate through autocomplete suggestions
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