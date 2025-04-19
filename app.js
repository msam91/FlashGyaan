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
 * - Audio pronunciation for words
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
            audioPlaying: false,   // Whether audio is currently playing
            audioError: null,      // Error message for audio playback
            showDefinition: false, // Whether to show the word definition
            learningMode: 'learning', // 'learning' or 'practice'
            alphabet: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'] // Array of letters for quick navigation
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
         * Determine if definition should be shown based on current mode
         * @returns {boolean} Whether to show the definition
         */
        shouldShowDefinition() {
            return this.learningMode === 'learning' || this.showDefinition;
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
                    // Don't set error here, just log it
                    console.error('No words were loaded');
                    this.isLoading = false;
                    return;
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
                // Don't set error here, just log it
                this.isLoading = false;
            }
        },

        /**
         * Navigate to a specific word
         * @param {Object} word - Word object to navigate to
         */
        goToWord(word) {
            const index = this.words.findIndex(w => w.word === word.word);
            if (index !== -1) {
                this.currentIndex = index;
                this.showDefinition = false; // Hide definition when navigating to a specific word
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
                this.showDefinition = false; // Hide definition when moving to next word
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
                this.showDefinition = false; // Hide definition when moving to previous word
                setTimeout(() => {
                    this.currentIndex--;
                    this.cardExit = false;
                    this.cardEnter = true;
                    setTimeout(() => {
                        this.cardEnter = false;
                    }, 300);
                }, 300);
            }
        },

        /**
         * Play pronunciation audio for the current word
         */
        playPronunciation() {
            if (!this.currentWord || this.audioPlaying) return;
            
            const word = this.currentWord.word.toLowerCase();
            const audioPath = `/public/audio/${word}.mp3`;
            
            this.audioPlaying = true;
            this.audioError = null;
            
            const audio = new Audio(audioPath);
            
            audio.onended = () => {
                this.audioPlaying = false;
            };
            
            audio.onerror = (e) => {
                console.error('Error playing audio:', e);
                this.audioPlaying = false;
                // Don't set error here, try speech synthesis first
                this.speakWord(word);
            };
            
            audio.play().catch(error => {
                console.error('Error playing audio:', error);
                this.audioPlaying = false;
                // Don't set error here, try speech synthesis first
                this.speakWord(word);
            });
        },
        
        /**
         * Use Web Speech API as a fallback for pronunciation
         * @param {string} word - The word to speak
         */
        speakWord(word) {
            if (!window.speechSynthesis) {
                this.audioError = 'Speech synthesis not supported in this browser';
                return;
            }
            
            // Cancel any existing speech
            window.speechSynthesis.cancel();
            
            const utterance = new SpeechSynthesisUtterance(word);
            utterance.rate = 0.8; // Slightly slower for clarity
            
            // Set error to null before starting speech synthesis
            this.audioError = null;
            
            utterance.onend = () => {
                this.audioPlaying = false;
                // Ensure error is still null after successful speech
                this.audioError = null;
            };
            
            utterance.onerror = (e) => {
                console.error('Speech synthesis error:', e);
                this.audioPlaying = false;
                
                // Only set error for actual failures, not for expected fallbacks
                if (e.error !== 'interrupted' && e.error !== 'canceled') {
                    this.audioError = 'Speech synthesis failed';
                } else {
                    // For interrupted or canceled speech, keep error as null
                    this.audioError = null;
                }
            };
            
            window.speechSynthesis.speak(utterance);
        },

        /**
         * Highlight matching text in search results
         * @param {string} text - The text to search in
         * @param {string} query - The search query
         * @returns {string} HTML string with highlighted matches
         */
        highlightMatch(text, query) {
            if (!query) return text;
            
            const regex = new RegExp(`(${query})`, 'gi');
            return text.replace(regex, '<span class="bg-yellow-200">$1</span>');
        },

        /**
         * Toggle between learning and practice modes
         */
        toggleMode() {
            this.learningMode = this.learningMode === 'learning' ? 'practice' : 'learning';
            // Reset showDefinition when switching to practice mode
            if (this.learningMode === 'practice') {
                this.showDefinition = false;
            }
        },

        /**
         * Jump to the first word starting with the selected letter
         * Provides quick navigation through the vocabulary by letter
         * @param {string} letter - The letter to jump to (A-Z)
         */
        jumpToLetter(letter) {
            const index = this.words.findIndex(word => word.word.charAt(0).toUpperCase() === letter);
            if (index !== -1) {
                this.cardExit = true;
                this.showDefinition = false;
                setTimeout(() => {
                    this.currentIndex = index;
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

// Mount the Vue application when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    app.mount('#app');
}); 