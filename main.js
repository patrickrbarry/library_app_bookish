// main.js
// Main application logic for Bookish Library

let sortField = null;
let sortDir = 'asc';
let currentDetailBook = null;

// DOM Elements - Filters
const searchInput = document.getElementById('searchInput');
const fictionFilter = document.getElementById('fictionFilter');
const genreFilter = document.getElementById('genreFilter');
const statusFilter = document.getElementById('statusFilter');
const formatCheckboxes = {
  audible: document.getElementById('audibleFilter'),
  kindle: document.getElementById('kindleFilter'),
  physical: document.getElementById('physicalFilter')
};

// DOM Elements - Table
const tbody = document.querySelector('#libraryTable tbody');
const headerCells = document.querySelectorAll('#libraryTable thead th[data-field]');
const countShownEl = document.getElementById('countShown');
const countTotalEl = document.getElementById('countTotal');

// DOM Elements - Detail Sheet
const detailSheet = document.getElementById('detailSheet');
const detailBackdrop = document.getElementById('detailBackdrop');
const detailClose = document.getElementById('detailClose');
const detailTitle = document.getElementById('detailTitle');
const detailAuthor = document.getElementById('detailAuthor');
const detailMeta = document.getElementById('detailMeta');
const detailFormats = document.getElementById('detailFormats');
const detailNotes = document.getElementById('detailNotes');
const detailTags = document.getElementById('detailTags');

// DOM Elements - Actions
const addBookBtn = document.getElementById('addBookBtn');
const amazonOpen = document.getElementById('amazonOpen');
const amazonCopy = document.getElementById('amazonCopy');
const editBookBtn = document.getElementById('editBookBtn');
const deleteBookBtn = document.getElementById('deleteBookBtn');
const importBtn = document.getElementById('importBtn');
const exportBtn = document.getElementById('exportBtn');

// DOM Elements - Add/Edit Modal
const bookModal = document.getElementById('bookModal');
const bookModalBackdrop = document.getElementById('bookModalBackdrop');
const bookModalClose = document.getElementById('bookModalClose');
const bookForm = document.getElementById('bookForm');
const modalTitle = document.getElementById('modalTitle');
const saveBookBtn = document.getElementById('saveBookBtn');
const isbnInput = document.getElementById('isbnInput');
const isbnLookupBtn = document.getElementById('isbnLookupBtn');

// OCR Elements
const scanTitleBtn = document.getElementById('scanTitleBtn');
const scanSpineBtn = document.getElementById('scanSpineBtn');
const ocrCamera = document.getElementById('ocrCamera');
const ocrCameraVideo = document.getElementById('ocrCameraVideo');
const ocrCaptureBtn = document.getElementById('ocrCaptureBtn');
const ocrCancelBtn = document.getElementById('ocrCancelBtn');
const ocrResultBox = document.getElementById('ocrResultBox');
const ocrLineSelector = document.getElementById('ocrLineSelector');
const useOcrResultBtn = document.getElementById('useOcrResultBtn');
const retryOcrBtn = document.getElementById('retryOcrBtn');

let ocrStream = null;
let ocrLines = [];
let selectedLines = {
  title: [],
  author: []
};

// Initialize app
function init() {
  populateGenreFilter();
  setupEventListeners();
  applyFilters();
}

// Populate genre filter dropdown
function populateGenreFilter() {
  const genres = DataManager.getGenres();
  genreFilter.innerHTML = '<option value="">All Genres</option>';
  genres.forEach(genre => {
    const option = document.createElement('option');
    option.value = genre;
    option.textContent = genre;
    genreFilter.appendChild(option);
  });
}

// Setup all event listeners
function setupEventListeners() {
  // Filter listeners
  searchInput.addEventListener('input', applyFilters);
  fictionFilter.addEventListener('change', applyFilters);
  genreFilter.addEventListener('change', applyFilters);
  statusFilter.addEventListener('change', applyFilters);
  
  Object.values(formatCheckboxes).forEach(checkbox => {
    checkbox.addEventListener('change', applyFilters);
  });

  // Sorting listeners
  headerCells.forEach(th => {
    th.addEventListener('click', handleSort);
  });

  // Detail sheet listeners
  detailBackdrop.addEventListener('click', closeDetail);
  detailClose.addEventListener('click', closeDetail);
  amazonOpen.addEventListener('click', handleAmazonOpen);
  amazonCopy.addEventListener('click', handleAmazonCopy);
  editBookBtn.addEventListener('click', handleEditBook);
  deleteBookBtn.addEventListener('click', handleDeleteBook);

  // Modal listeners
  addBookBtn.addEventListener('click', () => openBookModal());
  bookModalBackdrop.addEventListener('click', closeBookModal);
  bookModalClose.addEventListener('click', closeBookModal);
  bookForm.addEventListener('submit', handleSaveBook);
  isbnLookupBtn.addEventListener('click', handleISBNLookup);
  
  // Allow Enter key in ISBN input
  isbnInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleISBNLookup();
    }
  });

  // OCR listeners
  scanTitleBtn.addEventListener('click', () => startOCRCamera('title'));
  scanSpineBtn.addEventListener('click', () => startOCRCamera('spine'));
  ocrCaptureBtn.addEventListener('click', captureAndProcessOCR);
  ocrCancelBtn.addEventListener('click', stopOCRCamera);
  useOcrResultBtn.addEventListener('click', useOCRResult);
  retryOcrBtn.addEventListener('click', () => {
    ocrResultBox.style.display = 'none';
    startOCRCamera('title');
  });

  // Import/Export listeners
  importBtn.addEventListener('click', handleImport);
  exportBtn.addEventListener('click', handleExport);

  // Keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (bookModal.classList.contains('open')) {
        closeBookModal();
      } else if (detailSheet.classList.contains('open')) {
        closeDetail();
      }
    }
  });
}

// Apply all filters and render
function applyFilters() {
  const books = DataManager.getBooks();
  const term = searchInput.value.toLowerCase().trim();
  const fictionVal = fictionFilter.value;
  const genreVal = genreFilter.value;
  const statusVal = statusFilter.value;
  
  const wantAudible = formatCheckboxes.audible?.checked || false;
  const wantKindle = formatCheckboxes.kindle?.checked || false;
  const wantPhysical = formatCheckboxes.physical?.checked || false;
  
  console.log('Format filters:', { wantAudible, wantKindle, wantPhysical });

  let filtered = books.filter(book => {
    // Search term
    if (term) {
      const searchable = [
        book.title || '',
        book.author || '',
        book.genre || '',
        book.notes || '',
        book.fictionType || ''
      ].join(' ').toLowerCase();
      
      if (!searchable.includes(term)) return false;
    }

    // Fiction/Nonfiction filter
    if (fictionVal && book.fictionType !== fictionVal) return false;

    // Genre filter
    if (genreVal && book.genre !== genreVal) return false;

    // Status filter
    if (statusVal && book.status !== statusVal) return false;

    // Format filters
    if (wantAudible && !book.formats.includes('audible')) return false;
    if (wantKindle && !book.formats.includes('kindle')) return false;
    if (wantPhysical && !book.formats.includes('physical')) return false;

    return true;
  });

  // Apply sorting
  if (sortField) {
    filtered.sort((a, b) => {
      let aVal = a[sortField] || '';
      let bVal = b[sortField] || '';
      
      // Special handling for arrays (formats)
      if (Array.isArray(aVal)) aVal = aVal.join(',');
      if (Array.isArray(bVal)) bVal = bVal.join(',');
      
      aVal = aVal.toString().toLowerCase();
      bVal = bVal.toString().toLowerCase();
      
      if (aVal < bVal) return sortDir === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
  }

  renderBooks(filtered, books.length);
}

// Render books in table
function renderBooks(books, totalCount) {
  tbody.innerHTML = '';
  
  books.forEach(book => {
    const tr = document.createElement('tr');
    tr.dataset.bookId = book.id;

    // Title
    const titleTd = document.createElement('td');
    titleTd.textContent = book.title || '';
    tr.appendChild(titleTd);

    // Author
    const authorTd = document.createElement('td');
    authorTd.textContent = book.author || '';
    tr.appendChild(authorTd);

    // Genre
    const genreTd = document.createElement('td');
    if (book.genre) {
      const pill = document.createElement('span');
      pill.className = 'pill';
      pill.textContent = book.genre;
      genreTd.appendChild(pill);
    }
    tr.appendChild(genreTd);

    // Fiction/Nonfiction
    const typeTd = document.createElement('td');
    if (book.fictionType) {
      const pill = document.createElement('span');
      pill.className = 'pill ' + (book.fictionType === 'Fiction' ? 'fiction' : 'nonfiction');
      pill.textContent = book.fictionType;
      typeTd.appendChild(pill);
    }
    tr.appendChild(typeTd);

    // Status
    const statusTd = document.createElement('td');
    if (book.status) {
      const badge = document.createElement('span');
      badge.className = 'badge ' + book.status.toLowerCase();
      badge.textContent = book.status;
      statusTd.appendChild(badge);
    }
    tr.appendChild(statusTd);

    // Formats
    const formatsTd = document.createElement('td');
    if (book.formats && book.formats.length > 0) {
      const formatText = book.formats.map(f => {
        if (f === 'physical') return '📕';
        if (f === 'kindle') return '📱';
        if (f === 'audible') return '🎧';
        return f;
      }).join(' ');
      formatsTd.textContent = formatText;
    }
    tr.appendChild(formatsTd);

    // Click to open detail
    tr.addEventListener('click', () => openDetail(book));

    tbody.appendChild(tr);
  });

  // Update counts
  countShownEl.textContent = books.length + ' shown';
  countTotalEl.textContent = totalCount + ' total';
}

// Handle column sorting
function handleSort(e) {
  const th = e.currentTarget;
  const field = th.getAttribute('data-field');
  if (!field) return;

  if (sortField === field) {
    sortDir = sortDir === 'asc' ? 'desc' : 'asc';
  } else {
    sortField = field;
    sortDir = 'asc';
  }

  // Update UI
  headerCells.forEach(h => h.classList.remove('sort-asc', 'sort-desc'));
  th.classList.add(sortDir === 'asc' ? 'sort-asc' : 'sort-desc');

  applyFilters();
}

// Open detail sheet
function openDetail(book) {
  currentDetailBook = book;
  
  detailTitle.textContent = book.title || '';
  detailAuthor.textContent = book.author ? 'by ' + book.author : '';

  // Meta info
  const metaBits = [];
  if (book.fictionType) metaBits.push(book.fictionType);
  if (book.genre) metaBits.push(book.genre);
  if (book.difficulty) metaBits.push(book.difficulty + ' read');
  if (book.acquiredDate) metaBits.push('Acquired: ' + book.acquiredDate);
  detailMeta.textContent = metaBits.join(' • ');

  // Formats
  if (book.formats && book.formats.length > 0) {
    const formatLabels = book.formats.map(f => {
      return f.charAt(0).toUpperCase() + f.slice(1);
    });
    detailFormats.textContent = 'Formats: ' + formatLabels.join(', ');
  } else {
    detailFormats.textContent = 'Formats: —';
  }

  // Notes
  if (book.notes) {
    detailNotes.textContent = book.notes;
    detailNotes.style.display = 'block';
  } else {
    detailNotes.style.display = 'none';
  }

  // Tags
  detailTags.innerHTML = '';
  const tags = [];
  if (book.status) tags.push(book.status);
  if (book.formats) tags.push(...book.formats);
  
  tags.forEach(tag => {
    const span = document.createElement('span');
    span.textContent = tag;
    detailTags.appendChild(span);
  });

  detailSheet.classList.add('open');
  detailSheet.setAttribute('aria-hidden', 'false');
}

// Close detail sheet
function closeDetail() {
  detailSheet.classList.remove('open');
  detailSheet.setAttribute('aria-hidden', 'true');
  currentDetailBook = null;
}

// Open Amazon page
function handleAmazonOpen() {
  if (!currentDetailBook) return;
  const url = buildAmazonUrl(currentDetailBook);
  window.open(url, '_blank');
}

// Copy Amazon link
async function handleAmazonCopy() {
  if (!currentDetailBook) return;
  const url = buildAmazonUrl(currentDetailBook);
  
  try {
    await navigator.clipboard.writeText(url);
    showToast('Amazon link copied to clipboard!');
  } catch (e) {
    window.prompt('Copy this Amazon link:', url);
  }
}

// Build Amazon search URL
function buildAmazonUrl(book) {
  const query = encodeURIComponent((book.title + ' ' + book.author).trim());
  return 'https://www.amazon.com/s?k=' + query;
}

// Open book modal (add or edit)
function openBookModal(book = null) {
  console.log('openBookModal called with book:', book);
  
  if (book) {
    // Edit mode
    console.log('Edit mode - book ID:', book.id);
    modalTitle.textContent = 'Edit Book';
    document.getElementById('bookTitle').value = book.title || '';
    document.getElementById('bookAuthor').value = book.author || '';
    document.getElementById('bookGenre').value = book.genre || '';
    document.getElementById('bookFictionType').value = book.fictionType || '';
    document.getElementById('bookDifficulty').value = book.difficulty || '';
    document.getElementById('bookStatus').value = book.status || '';
    document.getElementById('bookNotes').value = book.notes || '';
    document.getElementById('bookAcquiredDate').value = book.acquiredDate || '';
    document.getElementById('bookISBN').value = book.isbn || '';
    
    // Formats
    document.getElementById('formatPhysical').checked = book.formats.includes('physical');
    document.getElementById('formatKindle').checked = book.formats.includes('kindle');
    document.getElementById('formatAudible').checked = book.formats.includes('audible');
    
    bookForm.dataset.editId = book.id;
  } else {
    // Add mode
    console.log('Add mode');
    modalTitle.textContent = 'Add New Book';
    bookForm.reset();
    delete bookForm.dataset.editId;
    
    // Scroll to top of modal to show "Quick Add by Photo" section
    setTimeout(() => {
      const modalBody = document.querySelector('.modal-body');
      if (modalBody) {
        modalBody.scrollTop = 0;
      }
    }, 100);
  }
  
  bookModal.classList.add('open');
  bookModal.setAttribute('aria-hidden', 'false');
}

// Close book modal
function closeBookModal() {
  bookModal.classList.remove('open');
  bookModal.setAttribute('aria-hidden', 'true');
  bookForm.reset();
  delete bookForm.dataset.editId;
}

// Handle book form submission
function handleSaveBook(e) {
  e.preventDefault();
  
  const formats = [];
  if (document.getElementById('formatPhysical').checked) formats.push('physical');
  if (document.getElementById('formatKindle').checked) formats.push('kindle');
  if (document.getElementById('formatAudible').checked) formats.push('audible');
  
  const bookData = {
    title: document.getElementById('bookTitle').value.trim(),
    author: document.getElementById('bookAuthor').value.trim(),
    genre: document.getElementById('bookGenre').value.trim(),
    fictionType: document.getElementById('bookFictionType').value,
    difficulty: document.getElementById('bookDifficulty').value,
    status: document.getElementById('bookStatus').value,
    notes: document.getElementById('bookNotes').value.trim(),
    acquiredDate: document.getElementById('bookAcquiredDate').value,
    isbn: document.getElementById('bookISBN').value.trim(),
    formats: formats,
    coverUrl: ''
  };
  
  const editId = bookForm.dataset.editId;
  
  if (editId) {
    // Update existing book
    DataManager.updateBook(editId, bookData);
    showToast('Book updated successfully!');
  } else {
    // Add new book
    DataManager.addBook(bookData);
    showToast('Book added successfully!');
  }
  
  closeBookModal();
  populateGenreFilter(); // Refresh genres in case new one was added
  applyFilters();
}

// Handle edit book button
function handleEditBook() {
  console.log('Edit button clicked, currentDetailBook:', currentDetailBook);
  if (!currentDetailBook) {
    console.error('No currentDetailBook set!');
    return;
  }
  
  // Save reference before closeDetail clears it
  const bookToEdit = currentDetailBook;
  closeDetail();
  openBookModal(bookToEdit);
}

// Handle delete book button
function handleDeleteBook() {
  if (!currentDetailBook) return;
  
  if (confirm(`Are you sure you want to delete "${currentDetailBook.title}"?`)) {
    DataManager.deleteBook(currentDetailBook.id);
    showToast('Book deleted successfully!');
    closeDetail();
    applyFilters();
  }
}

// Handle import
function handleImport() {
  const jsonInput = prompt(
    'Paste your book data as JSON array:\n' +
    'Format: [{"title":"Book","author":"Author","status":"unread","genre":"Fiction",...}]'
  );
  
  if (!jsonInput) return;
  
  try {
    const books = JSON.parse(jsonInput);
    if (!Array.isArray(books)) {
      alert('Invalid format. Please provide a JSON array.');
      return;
    }
    
    // Normalize the data to match our structure
    const normalizedBooks = books.map(book => ({
      title: book.title || book.Title || '',
      author: book.author || book.Author || '',
      status: book.status || book.Read_Status || 'unread',
      genre: book.genre || book.Primary_Genre || '',
      fictionType: book.fictionType || book.Fiction_Nonfiction || '',
      difficulty: book.difficulty || book.Difficulty || '',
      formats: book.formats || determineFormats(book),
      notes: book.notes || book.Notes || '',
      isbn: book.isbn || book.ISBN || '',
      acquiredDate: book.acquiredDate || book.First_Acquired || book.addedAt || '',
      publicationDate: book.publicationDate || '',
      coverUrl: book.coverUrl || ''
    }));
    
    const imported = DataManager.importBooks(normalizedBooks);
    showToast(`Successfully imported ${imported} new book(s)!`);
    populateGenreFilter();
    applyFilters();
  } catch (e) {
    alert('Error parsing JSON: ' + e.message);
  }
}

// Helper to determine formats from old data structure
function determineFormats(book) {
  const formats = [];
  if (book.Has_Physical === 'checked' || book.format === 'physical' || book.formats?.includes('physical')) {
    formats.push('physical');
  }
  if (book.Has_Kindle === 'checked' || book.format === 'kindle' || book.formats?.includes('kindle')) {
    formats.push('kindle');
  }
  if (book.Has_Audible === 'checked' || book.format === 'audible' || book.formats?.includes('audible')) {
    formats.push('audible');
  }
  if (formats.length === 0 && book.format) {
    formats.push(book.format);
  }
  return formats;
}

// Handle export
function handleExport() {
  const books = DataManager.getBooks();
  const json = JSON.stringify(books, null, 2);
  
  // Create timestamped filename
  const now = new Date();
  const timestamp = now.toISOString().slice(0, 16).replace('T', '-').replace(':', 'h');
  const filename = `bookish-backup-${timestamp}.json`;
  
  // Create download
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  
  showToast(`📤 Exported ${books.length} books!`);
}

// Show toast notification
function showToast(message, duration = 3000) {
  const toast = document.getElementById('toast');
  const toastMessage = document.getElementById('toastMessage');
  
  toastMessage.textContent = message;
  toast.classList.add('show');
  
  setTimeout(() => {
    toast.classList.remove('show');
  }, duration);
}

// Handle ISBN lookup from input field
async function handleISBNLookup() {
  const isbn = isbnInput.value.trim();
  
  if (!isbn) {
    alert('Please paste an ISBN number first');
    return;
  }
  
  // Clean and validate
  const cleanISBN = isbn.replace(/[^0-9X]/gi, '');
  
  if (cleanISBN.length !== 10 && cleanISBN.length !== 13) {
    alert('Please enter a valid 10 or 13 digit ISBN');
    return;
  }
  
  // Disable button during lookup
  isbnLookupBtn.disabled = true;
  isbnLookupBtn.textContent = '⏳ Looking up...';
  
  await lookupISBN(cleanISBN);
  
  // Re-enable button
  isbnLookupBtn.disabled = false;
  isbnLookupBtn.textContent = '🔍 Lookup';
  
  // Clear input
  isbnInput.value = '';
}

// Lookup ISBN using Open Library API
async function lookupISBN(isbn) {
  console.log('=== ISBN LOOKUP START ===');
  console.log('Original ISBN:', isbn);
  showToast(`🔍 Looking up: ${isbn}`);
  
  try {
    // Clean ISBN (remove hyphens, spaces)
    const cleanISBN = isbn.replace(/[^0-9X]/gi, '');
    console.log('Clean ISBN:', cleanISBN, 'Length:', cleanISBN.length);
    
    // If ISBN-10, try to convert to ISBN-13
    let isbn13 = cleanISBN;
    if (cleanISBN.length === 10) {
      isbn13 = convertISBN10to13(cleanISBN);
      console.log('Converted ISBN-10 to ISBN-13:', isbn13);
    }
    
    // Try both ISBN-13 and ISBN-10
    const isbnsToTry = cleanISBN.length === 10 ? [isbn13, cleanISBN] : [cleanISBN];
    
    for (const isbnToTry of isbnsToTry) {
      console.log('Trying ISBN:', isbnToTry);
      
      // Try Open Library API
      const url = `https://openlibrary.org/isbn/${isbnToTry}.json`;
      console.log('Fetching:', url);
      
      const response = await fetch(url);
      console.log('Response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Open Library SUCCESS! Data:', data);
        
        // Extract title
        if (data.title) {
          document.getElementById('bookTitle').value = data.title;
        }
        
        // Get author info
        if (data.authors && data.authors.length > 0) {
          try {
            const authorKey = data.authors[0].key;
            const authorResponse = await fetch(`https://openlibrary.org${authorKey}.json`);
            const authorData = await authorResponse.json();
            if (authorData.name) {
              document.getElementById('bookAuthor').value = authorData.name;
            }
          } catch (e) {
            console.error('Author fetch error:', e);
            // If author fetch fails, try to get from publishers
            if (data.by_statement) {
              document.getElementById('bookAuthor').value = data.by_statement;
            }
          }
        }
        
        // Set ISBN
        document.getElementById('bookISBN').value = isbnToTry;
        
        // Get publication date
        if (data.publish_date) {
          document.getElementById('bookPublicationDate').value = data.publish_date;
        }
        
        // Get cover URL
        if (data.covers && data.covers.length > 0) {
          const coverId = data.covers[0];
          document.getElementById('bookCoverUrl').value = `https://covers.openlibrary.org/b/id/${coverId}-L.jpg`;
        }
        
        // Try to get subjects for genre classification
        if (data.subjects && data.subjects.length > 0) {
          const subjects = data.subjects.map(s => s.toLowerCase());
          autoClassifyFromSubjects(subjects);
        }
        
        showToast('✅ Book found! Review and save.');
        return; // Success!
      }
    }
    
    // If Open Library failed, try Google Books
    console.log('Open Library failed for all ISBNs, trying Google Books...');
    await lookupGoogleBooks(isbn13 || cleanISBN);
    
  } catch (error) {
    console.error('ISBN lookup error:', error);
    // Try Google Books as backup
    console.log('Error occurred, trying Google Books as backup...');
    await lookupGoogleBooks(isbn.replace(/[^0-9X]/gi, ''));
  }
}

// Convert ISBN-10 to ISBN-13
function convertISBN10to13(isbn10) {
  // Remove check digit and add 978 prefix
  const base = '978' + isbn10.substring(0, 9);
  
  // Calculate ISBN-13 check digit
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(base[i]) * (i % 2 === 0 ? 1 : 3);
  }
  const checkDigit = (10 - (sum % 10)) % 10;
  
  return base + checkDigit;
}

// Backup lookup using Google Books API
async function lookupGoogleBooks(isbn) {
  try {
    const url = `https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}`;
    console.log('Fetching Google Books:', url);
    
    const response = await fetch(url);
    const data = await response.json();
    console.log('Google Books response:', data);
    
    if (!data.items || data.items.length === 0) {
      throw new Error('Book not found in Google Books either');
    }
    
    const book = data.items[0].volumeInfo;
    console.log('✅ Google Books SUCCESS! Book:', book);
    
    // Extract data
    if (book.title) {
      document.getElementById('bookTitle').value = book.title;
    }
    
    if (book.authors && book.authors.length > 0) {
      document.getElementById('bookAuthor').value = book.authors.join(', ');
    }
    
    document.getElementById('bookISBN').value = isbn;
    
    if (book.publishedDate) {
      document.getElementById('bookPublicationDate').value = book.publishedDate;
    }
    
    if (book.imageLinks && book.imageLinks.thumbnail) {
      document.getElementById('bookCoverUrl').value = book.imageLinks.thumbnail.replace('http:', 'https:');
    }
    
    // Try to classify from categories
    if (book.categories && book.categories.length > 0) {
      autoClassifyFromSubjects(book.categories.map(c => c.toLowerCase()));
    }
    
    showToast('✅ Book found (Google Books)! Review and save.');
    
  } catch (error) {
    console.error('Google Books lookup error:', error);
    console.log('=== LOOKUP FAILED - Book not in any database ===');
    showToast(`❌ ISBN ${isbn} not found. Enter details manually.`);
    // Pre-fill ISBN at least
    document.getElementById('bookISBN').value = isbn;
  }
}

// Auto-classify based on Open Library subjects
function autoClassifyFromSubjects(subjects) {
  const subjectStr = subjects.join(' ');
  
  // Fiction vs Nonfiction detection
  if (subjects.includes('fiction') || subjects.includes('novel') || subjects.includes('science fiction')) {
    document.getElementById('bookFictionType').value = 'Fiction';
    
    // Genre detection for fiction
    if (subjectStr.includes('science fiction') || subjectStr.includes('sci-fi') || subjectStr.includes('sf')) {
      document.getElementById('bookGenre').value = 'Science Fiction';
    } else if (subjectStr.includes('fantasy')) {
      document.getElementById('bookGenre').value = 'Fantasy';
    } else if (subjectStr.includes('mystery') || subjectStr.includes('detective')) {
      document.getElementById('bookGenre').value = 'Mystery';
    } else if (subjectStr.includes('thriller') || subjectStr.includes('suspense')) {
      document.getElementById('bookGenre').value = 'Thriller';
    } else if (subjectStr.includes('romance')) {
      document.getElementById('bookGenre').value = 'Romance';
    } else if (subjectStr.includes('historical')) {
      document.getElementById('bookGenre').value = 'Historical Fiction';
    } else if (subjectStr.includes('horror')) {
      document.getElementById('bookGenre').value = 'Horror';
    } else {
      document.getElementById('bookGenre').value = 'Literary Fiction';
    }
    
  } else {
    document.getElementById('bookFictionType').value = 'Nonfiction';
    
    // Genre detection for nonfiction
    if (subjectStr.includes('history')) {
      document.getElementById('bookGenre').value = 'History';
    } else if (subjectStr.includes('biography') || subjectStr.includes('memoir')) {
      document.getElementById('bookGenre').value = 'Biography';
    } else if (subjectStr.includes('science')) {
      document.getElementById('bookGenre').value = 'Science';
    } else if (subjectStr.includes('philosophy')) {
      document.getElementById('bookGenre').value = 'Philosophy';
    } else if (subjectStr.includes('business') || subjectStr.includes('management')) {
      document.getElementById('bookGenre').value = 'Business';
    } else if (subjectStr.includes('self-help') || subjectStr.includes('self help')) {
      document.getElementById('bookGenre').value = 'Self-Help';
    } else if (subjectStr.includes('psychology')) {
      document.getElementById('bookGenre').value = 'Psychology';
    }
  }
  
  // Default difficulty to Moderate (user can adjust)
  if (!document.getElementById('bookDifficulty').value) {
    document.getElementById('bookDifficulty').value = 'Moderate';
  }
}

// Start OCR camera
async function startOCRCamera(mode) {
  try {
    ocrStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'environment' }
    });
    
    ocrCameraVideo.srcObject = ocrStream;
    ocrCamera.classList.add('active');
    ocrCameraVideo.setAttribute('data-mode', mode);
    
  } catch (error) {
    console.error('Camera error:', error);
    alert('Could not access camera. Please check permissions.');
  }
}

// Stop OCR camera
function stopOCRCamera() {
  if (ocrStream) {
    ocrStream.getTracks().forEach(track => track.stop());
    ocrStream = null;
  }
  ocrCamera.classList.remove('active');
}

// Capture and process with OCR
async function captureAndProcessOCR() {
  const mode = ocrCameraVideo.getAttribute('data-mode');
  
  // Create canvas to capture image
  const canvas = document.createElement('canvas');
  canvas.width = ocrCameraVideo.videoWidth;
  canvas.height = ocrCameraVideo.videoHeight;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(ocrCameraVideo, 0, 0);
  
  // Stop camera
  stopOCRCamera();
  
  // Show processing message
  showToast('🔍 Reading text from image... (this takes 3-5 seconds)', 10000);
  
  // Process with Tesseract
  try {
    const { data: { text } } = await Tesseract.recognize(
      canvas.toDataURL('image/jpeg'),
      'eng',
      {
        logger: m => {
          if (m.status === 'recognizing text') {
            const progress = Math.round(m.progress * 100);
            showToast(`📖 Processing: ${progress}%`, 10000);
          }
        }
      }
    );
    
    console.log('OCR Raw text:', text);
    
    // Split into lines and clean
    ocrLines = text
      .split('\n')
      .map(l => l.trim())
      .filter(l => l.length > 2) // Filter out very short lines
      .filter(l => !/^[^a-zA-Z]*$/.test(l)); // Filter out lines with no letters
    
    console.log('Cleaned lines:', ocrLines);
    
    if (ocrLines.length === 0) {
      showToast('❌ Could not find readable text. Try again with better lighting.');
      return;
    }
    
    // Reset selection
    selectedLines = { title: [], author: [] };
    
    // Display interactive line selector
    displayLineSelector();
    
    ocrResultBox.style.display = 'block';
    showToast('✅ Text extracted! Select title and author lines.');
    
  } catch (error) {
    console.error('OCR error:', error);
    showToast('❌ OCR failed. Please try again or enter manually.');
  }
}

// Display interactive line selector
function displayLineSelector() {
  ocrLineSelector.innerHTML = '';
  
  ocrLines.forEach((line, index) => {
    const lineDiv = document.createElement('div');
    lineDiv.className = 'ocr-line';
    lineDiv.dataset.index = index;
    
    // Line text
    const textSpan = document.createElement('span');
    textSpan.className = 'ocr-line-text';
    textSpan.textContent = line;
    
    // Badges container
    const badgesDiv = document.createElement('div');
    badgesDiv.className = 'ocr-line-badges';
    
    // Title badge
    const titleBadge = document.createElement('span');
    titleBadge.className = 'ocr-badge ocr-badge-title';
    titleBadge.textContent = 'Title';
    titleBadge.onclick = (e) => {
      e.stopPropagation();
      toggleSelection(index, 'title');
    };
    
    // Author badge
    const authorBadge = document.createElement('span');
    authorBadge.className = 'ocr-badge ocr-badge-author';
    authorBadge.textContent = 'Author';
    authorBadge.onclick = (e) => {
      e.stopPropagation();
      toggleSelection(index, 'author');
    };
    
    badgesDiv.appendChild(titleBadge);
    badgesDiv.appendChild(authorBadge);
    
    lineDiv.appendChild(textSpan);
    lineDiv.appendChild(badgesDiv);
    
    ocrLineSelector.appendChild(lineDiv);
  });
}

// Toggle line selection
function toggleSelection(index, type) {
  const line = ocrLines[index];
  const lineDiv = ocrLineSelector.querySelector(`[data-index="${index}"]`);
  
  if (type === 'title') {
    // Toggle title
    const titleIndex = selectedLines.title.indexOf(index);
    if (titleIndex > -1) {
      selectedLines.title.splice(titleIndex, 1);
      lineDiv.classList.remove('selected-title');
      lineDiv.querySelector('.ocr-badge-title').classList.remove('active');
    } else {
      selectedLines.title.push(index);
      lineDiv.classList.add('selected-title');
      lineDiv.querySelector('.ocr-badge-title').classList.add('active');
    }
  } else {
    // Toggle author
    const authorIndex = selectedLines.author.indexOf(index);
    if (authorIndex > -1) {
      selectedLines.author.splice(authorIndex, 1);
      lineDiv.classList.remove('selected-author');
      lineDiv.querySelector('.ocr-badge-author').classList.remove('active');
    } else {
      selectedLines.author.push(index);
      lineDiv.classList.add('selected-author');
      lineDiv.querySelector('.ocr-badge-author').classList.add('active');
    }
  }
  
  console.log('Selected title lines:', selectedLines.title.map(i => ocrLines[i]));
  console.log('Selected author lines:', selectedLines.author.map(i => ocrLines[i]));
}

// Use OCR result and lookup book
async function useOCRResult() {
  // Build title and author from selected lines
  const title = selectedLines.title.map(i => ocrLines[i]).join(' ').trim();
  const author = selectedLines.author.map(i => ocrLines[i]).join(' ').trim();
  
  console.log('Combined title:', title);
  console.log('Combined author:', author);
  
  if (!title && !author) {
    alert('Please select at least a title or author line first!');
    return;
  }
  
  ocrResultBox.style.display = 'none';
  showToast('🔍 Searching for book...');
  
  // Try multiple search strategies
  try {
    let bookData = null;
    
    // Strategy 1: Search by title AND author (most specific)
    if (title && author) {
      console.log('Strategy 1: Title + Author');
      bookData = await searchGoogleBooks(title, author);
    }
    
    // Strategy 2: Search by title only (if strategy 1 failed)
    if (!bookData && title) {
      console.log('Strategy 2: Title only');
      bookData = await searchGoogleBooks(title, null);
    }
    
    // Strategy 3: Search by author only (if strategy 2 failed)
    if (!bookData && author) {
      console.log('Strategy 3: Author only');
      bookData = await searchGoogleBooks(null, author);
    }
    
    if (!bookData) {
      throw new Error('No results found');
    }
    
    // Fill in details from found book
    if (bookData.title) {
      document.getElementById('bookTitle').value = bookData.title;
    }
    
    if (bookData.authors && bookData.authors.length > 0) {
      document.getElementById('bookAuthor').value = bookData.authors.join(', ');
    }
    
    if (bookData.industryIdentifiers) {
      const isbn13 = bookData.industryIdentifiers.find(id => id.type === 'ISBN_13');
      const isbn10 = bookData.industryIdentifiers.find(id => id.type === 'ISBN_10');
      if (isbn13) {
        document.getElementById('bookISBN').value = isbn13.identifier;
      } else if (isbn10) {
        document.getElementById('bookISBN').value = isbn10.identifier;
      }
    }
    
    if (bookData.publishedDate) {
      document.getElementById('bookPublicationDate').value = bookData.publishedDate;
    }
    
    if (bookData.imageLinks && bookData.imageLinks.thumbnail) {
      document.getElementById('bookCoverUrl').value = bookData.imageLinks.thumbnail.replace('http:', 'https:');
    }
    
    // Try to classify from categories
    if (bookData.categories && bookData.categories.length > 0) {
      autoClassifyFromSubjects(bookData.categories.map(c => c.toLowerCase()));
    }
    
    showToast('✅ Book found! Review and save.');
    
  } catch (error) {
    console.error('Lookup error:', error);
    showToast('❌ Could not find book in database. Pre-filled what you selected - please review.');
    
    // Pre-fill what they selected
    if (title) {
      document.getElementById('bookTitle').value = title;
    }
    if (author) {
      document.getElementById('bookAuthor').value = author;
    }
  }
}

// Search Google Books with different strategies
async function searchGoogleBooks(title, author) {
  const queryParts = [];
  
  if (title) {
    // Clean title - remove common words that might confuse search
    const cleanTitle = title
      .replace(/^(the|a|an)\s+/i, '') // Remove leading articles
      .trim();
    queryParts.push(`intitle:"${cleanTitle}"`);
  }
  
  if (author) {
    // Clean author - just last name might work better
    const authorParts = author.split(/\s+/);
    const lastName = authorParts[authorParts.length - 1];
    queryParts.push(`inauthor:${lastName}`);
  }
  
  if (queryParts.length === 0) {
    return null;
  }
  
  const query = queryParts.join('+');
  const url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=5`;
  
  console.log('Searching Google Books:', url);
  console.log('Query parts:', queryParts);
  
  const response = await fetch(url);
  const data = await response.json();
  
  console.log('Google Books response:', data);
  
  if (!data.items || data.items.length === 0) {
    console.log('No results found');
    return null;
  }
  
  // Return the first result
  console.log('Found book:', data.items[0].volumeInfo);
  return data.items[0].volumeInfo;
}

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
