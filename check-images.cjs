const fs = require('fs');
const path = require('path');

// Read all book files
const booksDir = './src/data/books';
const books = fs.readdirSync(booksDir).filter(f => f.endsWith('.ts'));

const allWords = [];

for (const bookFile of books) {
  const content = fs.readFileSync(path.join(booksDir, bookFile), 'utf8');
  
  // Extract words with images using regex
  const wordRegex = /(?:"word"|word):\s*"([^"]+)"/g;
  const imageRegex = /image:\s*"([^"]+)"/g;
  
  let wordMatch;
  const words = [];
  while ((wordMatch = wordRegex.exec(content)) !== null) {
    words.push(wordMatch[1]);
  }
  
  let imageMatch;
  const images = [];
  while ((imageMatch = imageRegex.exec(content)) !== null) {
    images.push(imageMatch[1]);
  }
  
  // Pair them up
  for (let i = 0; i < Math.min(words.length, images.length); i++) {
    if (images[i] && !images[i].includes('placeholder')) {
      allWords.push({
        book: bookFile,
        word: words[i],
        image: images[i]
      });
    }
  }
}

// Shuffle and pick random sample
const shuffled = allWords.sort(() => Math.random() - 0.5);
const sample = shuffled.slice(0, 50);

// Output as JSON
console.log(JSON.stringify(sample, null, 2));
