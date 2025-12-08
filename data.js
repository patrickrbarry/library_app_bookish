// data.js
// Unified data structure for Bookish Library

const BOOKISH_STORAGE_KEY = "bookish-library-v2";

// Seed data - these books will be loaded on first run if localStorage is empty
const INITIAL_BOOKS = [
  {
    id: "seed-1",
    title: "Before We Were Yours",
    author: "Lisa Wingate",
    status: "unread", // unread | reading | read
    genre: "Historical Fiction",
    fictionType: "Fiction", // Fiction | Nonfiction
    difficulty: "Moderate", // Light | Moderate | Dense
    formats: ["physical"], // Array: physical, kindle, audible
    notes: "From the living-room shelf test pile.",
    isbn: "9780425284681",
    publicationDate: "2017-06-06",
    acquiredDate: "2025-01-01",
    addedAt: new Date().toISOString(),
    coverUrl: "" // Optional cover image URL
  },
  {
    id: "seed-2",
    title: "Most Talkative",
    author: "Andy Cohen",
    status: "read",
    genre: "Memoir",
    fictionType: "Nonfiction",
    difficulty: "Light",
    formats: ["audible"],
    notes: "Audiobook – light and fun.",
    isbn: "9781250031464",
    publicationDate: "2013-04-02",
    acquiredDate: "2025-01-02",
    addedAt: new Date().toISOString(),
    coverUrl: ""
  }
];

// Data Manager - handles all localStorage operations
const DataManager = {
  
  // Get all books from localStorage
  getBooks() {
    try {
      const stored = localStorage.getItem(BOOKISH_STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
      // First run - initialize with seed data
      this.saveBooks(INITIAL_BOOKS);
      return INITIAL_BOOKS;
    } catch (e) {
      console.error("Error loading books:", e);
      return [];
    }
  },

  // Save books to localStorage
  saveBooks(books) {
    try {
      localStorage.setItem(BOOKISH_STORAGE_KEY, JSON.stringify(books));
      return true;
    } catch (e) {
      console.error("Error saving books:", e);
      return false;
    }
  },

  // Add a new book
  addBook(bookData) {
    const books = this.getBooks();
    const newBook = {
      id: "book-" + Date.now() + "-" + Math.random().toString(36).substr(2, 9),
      addedAt: new Date().toISOString(),
      ...bookData
    };
    books.push(newBook);
    this.saveBooks(books);
    return newBook;
  },

  // Update existing book
  updateBook(id, updates) {
    const books = this.getBooks();
    const index = books.findIndex(b => b.id === id);
    if (index !== -1) {
      books[index] = { ...books[index], ...updates };
      this.saveBooks(books);
      return books[index];
    }
    return null;
  },

  // Delete a book
  deleteBook(id) {
    const books = this.getBooks();
    const filtered = books.filter(b => b.id !== id);
    this.saveBooks(filtered);
    return filtered.length < books.length;
  },

  // Bulk import books (merge with existing)
  importBooks(newBooks) {
    const existing = this.getBooks();
    const existingTitles = new Set(existing.map(b => 
      (b.title + b.author).toLowerCase().trim()
    ));
    
    let imported = 0;
    newBooks.forEach(book => {
      const key = (book.title + book.author).toLowerCase().trim();
      if (!existingTitles.has(key)) {
        this.addBook(book);
        imported++;
      }
    });
    
    return imported;
  },

  // Export all books as JSON
  exportBooks() {
    return this.getBooks();
  },

  // Clear all data (with confirmation)
  clearAll() {
    localStorage.removeItem(BOOKISH_STORAGE_KEY);
  },

  // Get unique genres for filter
  getGenres() {
    const books = this.getBooks();
    const genres = new Set();
    books.forEach(book => {
      if (book.genre && book.genre !== "Unknown") {
        genres.add(book.genre);
      }
    });
    return Array.from(genres).sort();
  }
};

// Make DataManager available globally
window.DataManager = DataManager;
