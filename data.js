// data.js
// Seed data for Bookish. In practice, you can generate this or sync it from your sheet.

const INITIAL_BOOKS = [
  {
    id: "demo-1",
    title: "Before We Were Yours",
    author: "Lisa Wingate",
    status: "unread", // unread | reading | read
    format: "physical", // physical | kindle | audible | multiple
    genre: "Historical Fiction",
    notes: "From the living-room shelf test pile.",
    isbn: "9780425284681",
    publicationDate: "2017-06-06",
    addedAt: "2025-01-01"
  },
  {
    id: "demo-2",
    title: "Most Talkative",
    author: "Andy Cohen",
    status: "read",
    format: "audible",
    genre: "Memoir",
    notes: "Audiobook – light and fun.",
    isbn: "9781250031464",
    publicationDate: "2013-04-02",
    addedAt: "2025-01-02"
  }
];

// Local storage key for persistence
const BOOKISH_STORAGE_KEY = "bookish-library-v1";
