# FlashGyaan - GRE Vocabulary Learning App

FlashGyaan is an interactive web application designed to help users master GRE vocabulary through flashcards and quizzes. Built with Vue.js and modern web technologies, it offers an engaging way to learn and retain new words.

## Version

Current version: 1.0.0

See [CHANGELOG.md](CHANGELOG.md) for detailed version history.

## Features

- 📚 **Comprehensive Word Database**: Contains extensive GRE vocabulary organized alphabetically
- 🔄 **Interactive Flashcards**: Dynamic word cards with definitions, pronunciations, and example usage
- 🔊 **Audio Pronunciation**: Listen to correct pronunciation of words with audio playback
- 📝 **Smart Quiz System**: Generates random quizzes from the word database with multiple question types
- 🔍 **Quick Search**: Instant word lookup with real-time filtering and autocomplete
- 💾 **Offline Support**: Uses IndexedDB for local storage and offline access
- 📱 **Mobile-Friendly**: Responsive design with touch gesture support
- 🎯 **Progress Tracking**: Visual progress indicators and streak counting
- ⚡ **Performance Optimized**: Data compression and efficient caching
- 🔤 **Letter Navigation**: Quick access to words starting with specific letters
- 🎨 **Modern UI**: Clean and intuitive interface with smooth animations

## Getting Started

### Prerequisites

- Python 3.x (for development server)
- Modern web browser with JavaScript enabled
- Node.js (optional, for development)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/Flash-Gyaan.git
   cd Flash-Gyaan
   ```

2. Start the development server:
   ```bash
   python3 server.py
   ```

3. Open your browser and navigate to:
   ```
   http://localhost:8000
   ```

## Usage

### Flashcards

- Use left/right arrow keys or swipe gestures to navigate between words
- Click the pronunciation button to hear the word pronunciation
- View word definition, part of speech, and example usage
- Use the letter selection bar to quickly jump to words starting with specific letters

### Quiz Mode

1. Click "Take Quiz" to start a quiz session
2. Answer five randomly generated questions
3. Get immediate feedback on your answers
4. Track your progress with the streak counter

### Search

- Use the search bar to find specific words
- Search works across words and definitions
- Real-time filtering as you type
- Smart autocomplete with keyboard navigation:
  - Use arrow keys (↑/↓) to navigate suggestions
  - Press Enter to select a suggestion
  - Press Escape to close suggestions
  - Shows up to 5 most relevant matches
  - Displays both word and definition in suggestions

### Letter Navigation

- Use the letter selection bar at the top of the app
- Click any letter to jump to the first word starting with that letter
- Visual feedback shows the current word's starting letter
- Smooth animations when transitioning between words

## Acknowledgments

- Built with Vue.js
- Uses IndexedDB for offline storage
- Hammer.js for touch gestures
- Python for development server
- Web Speech API for fallback pronunciation
- Tailwind CSS for styling

## Support

For support, please open an issue in the GitHub repository or contact the maintainers. 