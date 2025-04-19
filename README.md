# FlashGyaan - GRE Vocabulary Learning App

FlashGyaan is an interactive web application designed to help users master GRE vocabulary through flashcards and quizzes. Built with Vue.js and modern web technologies, it offers an engaging way to learn and retain new words.

## Version

Current version: 1.0.0

See [CHANGELOG.md](CHANGELOG.md) for detailed version history.

## Features

- 📚 **Comprehensive Word Database**: Contains extensive GRE vocabulary organized alphabetically
- 🔄 **Interactive Flashcards**: Dynamic word cards with definitions, pronunciations, and example usage
- 📝 **Smart Quiz System**: Generates random quizzes from the word database with multiple question types
- 🔍 **Quick Search**: Instant word lookup with real-time filtering and autocomplete
- 💾 **Offline Support**: Uses IndexedDB for local storage and offline access
- 📱 **Mobile-Friendly**: Responsive design with touch gesture support
- 🎯 **Progress Tracking**: Visual progress indicators and streak counting
- ⚡ **Performance Optimized**: Data compression and efficient caching

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
- Click the pronunciation to hear the word (if available)
- View word definition, part of speech, and example usage

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

## Project Structure

```
Flash-Gyaan/
├── server.py           # Server launcher script
├── README.md           # Project documentation
├── CHANGELOG.md        # Version history and changes
├── version.txt         # Current version number
├── index.html          # Main HTML template
├── styles.css          # Application styles
├── app.js              # Main Vue.js application logic
├── db.js               # IndexedDB operations and data management
├── config/             # Configuration files
│   └── word-lists/     # Word list files organized alphabetically
└── server/             # Server code
    └── http_server.py  # Development server with CORS support
```

## Technical Details

- **Frontend**: Vue.js 3.x
- **Storage**: IndexedDB with compression
- **Server**: Python HTTP Server with CORS
- **Data Format**: Structured JSON with word metadata
- **Performance**: Optimized loading and caching strategies

## Development

### Versioning

This project follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html):

- **MAJOR** version (1.0.0) - Incompatible API changes
- **MINOR** version (0.1.0) - Add functionality in a backward-compatible manner
- **PATCH** version (0.0.1) - Backward-compatible bug fixes

### Development Workflow

1. **Feature Development**:
   - Create a feature branch from `develop`: `git checkout -b feature/feature-name develop`
   - Make changes and commit with descriptive messages
   - Push to remote: `git push origin feature/feature-name`
   - Create a pull request to merge into `develop`

2. **Release Process**:
   - Create a release branch from `develop`: `git checkout -b release/v1.0.0 develop`
   - Update version in `version.txt` and `CHANGELOG.md`
   - Commit changes: `git commit -m "Bump version to v1.0.0"`
   - Merge to `main` and `develop`: 
     ```
     git checkout main
     git merge --no-ff release/v1.0.0
     git tag -a v1.0.0 -m "Version 1.0.0"
     git checkout develop
     git merge --no-ff release/v1.0.0
     git branch -d release/v1.0.0
     ```

3. **Hotfix Process**:
   - Create a hotfix branch from `main`: `git checkout -b hotfix/1.0.1 main`
   - Fix the issue and update version
   - Merge to `main` and `develop`:
     ```
     git checkout main
     git merge --no-ff hotfix/1.0.1
     git tag -a v1.0.1 -m "Version 1.0.1"
     git checkout develop
     git merge --no-ff hotfix/1.0.1
     git branch -d hotfix/1.0.1
     ```

### Local Development

1. Start the development server:
   ```bash
   python3 server.py
   ```

2. The server includes:
   - CORS support for local development
   - Proper MIME type handling
   - Automatic port cleanup
   - Cache control headers

### Data Structure

Word objects follow this format:
```javascript
{
    word: "example",
    pronunciation: "ig-ˈzam-pəl",
    partOfSpeech: "noun",
    definition: "a representative instance",
    example: "This word is an example of proper usage."
}
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Built with Vue.js
- Uses IndexedDB for offline storage
- Hammer.js for touch gestures
- Python for development server

## Support

For support, please open an issue in the GitHub repository or contact the maintainers. 