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
const scanBarcodeBtn = document.getElementById('scanBarcodeBtn');
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

// Barcode Elements
const barcodeCamera = document.getElementById('barcodeCamera');
const barcodeCameraVideo = document.getElementById('barcodeCameraVideo');
const barcodeScanStatus = document.getElementById('barcodeScanStatus');
const barcodeCancelBtn = document.getElementById('barcodeCancelBtn');
const barcodeManualEntryBtn = document.getElementById('barcodeManualEntryBtn');

let ocrStream = null;
let barcodeStream = null;
let barcodeScanning = false;
let barcodeScanAttempts = 0;
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
  scanBarcodeBtn.addEventListener('click', startBarcodeScanner);
  scanTitleBtn.addEventListener('click', () => startOCRCamera('title'));
  scanSpineBtn.addEventListener('click', () => startOCRCamera('spine'));
  ocrCaptureBtn.addEventListener('click', captureAndProcessOCR);
  ocrCancelBtn.addEventListener('click', stopOCRCamera);
  useOcrResultBtn.addEventListener('click', useOCRResult);
  barcodeCancelBtn.addEventListener('click', stopBarcodeScanner);
  barcodeManualEntryBtn.addEventListener('click', () => {
    stopBarcodeScanner();
    const isbn = prompt('Enter ISBN (10 or 13 digits):');
    if (isbn && isbn.trim()) {
      lookupISBN(isbn.trim());
    }
  });
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

// ============================================================
// ZXING BARCODE SCANNER (Enhanced ISBN Detection)
// ============================================================

// Start ZXing barcode scanner
async function startBarcodeScanner() {
  try {
    barcodeScanAttempts = 0;
    
    barcodeStream = await navigator.mediaDevices.getUserMedia({
      video: { 
        facingMode: 'environment',
        width: { ideal: 1920 },
        height: { ideal: 1080 }
      }
    });
    
    barcodeCameraVideo.srcObject = barcodeStream;
    barcodeCamera.style.display = 'flex';
    
    // Wait for video to be ready
    await new Promise(resolve => {
      barcodeCameraVideo.onloadedmetadata = resolve;
    });
    
    barcodeScanning = true;
    scanBarcodeFrame();
    
  } catch (error) {
    console.error('Camera error:', error);
    alert('Could not access camera. Please check permissions in Settings → Safari → Camera.');
  }
}

// Stop barcode scanner
function stopBarcodeScanner() {
  barcodeScanning = false;
  barcodeScanAttempts = 0;
  if (barcodeStream) {
    barcodeStream.getTracks().forEach(track => track.stop());
    barcodeStream = null;
  }
  barcodeCamera.style.display = 'none';
  barcodeScanStatus.innerHTML = '<div style="font-size: 1.3rem; margin-bottom: 0.5rem;">📷 Position barcode in frame</div><div style="font-size: 0.9rem; font-weight: 400; color: #a0a0a0;">Hold steady • Scan happens automatically</div>';
}

// Scan barcode using ZXing
async function scanBarcodeFrame() {
  if (!barcodeScanning) return;
  
  barcodeScanAttempts++;
  
  // Update status every 10 attempts
  if (barcodeScanAttempts % 10 === 0) {
    const seconds = Math.floor(barcodeScanAttempts / 10);
    barcodeScanStatus.innerHTML = `<div style="font-size: 1.1rem;">🔍 Scanning... (${seconds}s)</div><div style="font-size: 0.85rem; margin-top: 0.5rem; color: #a0a0a0;">Make sure barcode is in frame</div>`;
  }
  
  try {
    const codeReader = new ZXing.BrowserMultiFormatReader();
    
    // Create canvas from video frame
    const canvas = document.createElement('canvas');
    canvas.width = barcodeCameraVideo.videoWidth;
    canvas.height = barcodeCameraVideo.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(barcodeCameraVideo, 0, 0);
    
    // Try to decode from canvas
    const result = await codeReader.decodeFromImageElement(canvas);
    
    if (result && result.text) {
      console.log('✅ Barcode detected:', result.text, 'Format:', result.format);
      
      const isbn = result.text.replace(/[^0-9X]/gi, '');
      
      // Validate ISBN length
      if (isbn.length === 10 || isbn.length === 13) {
        // Check if it starts with 978 or 979 (valid ISBN-13 prefix) or is ISBN-10
        const isValidISBN = isbn.length === 10 || 
                           (isbn.length === 13 && (isbn.startsWith('978') || isbn.startsWith('979')));
        
        if (isValidISBN) {
          barcodeScanStatus.innerHTML = '<div style="font-size: 1.3rem; color: #4ade80;">✅ ISBN Found!</div><div style="font-size: 1rem; margin-top: 0.5rem;">' + isbn + '</div>';
          
          setTimeout(() => {
            stopBarcodeScanner();
            lookupISBN(isbn);
          }, 800);
          return;
        }
      }
      
      // Not a valid ISBN, show feedback
      barcodeScanStatus.innerHTML = '<div style="font-size: 1.1rem; color: #ef4444;">⚠️ Not an ISBN</div><div style="font-size: 0.85rem; margin-top: 0.5rem;">Found: ' + result.text + '</div><div style="font-size: 0.85rem; color: #a0a0a0;">Looking for more barcodes...</div>';
      setTimeout(() => {
        if (barcodeScanning) scanBarcodeFrame();
      }, 1000);
    }
    
  } catch (error) {
    // No barcode found in this frame, try again
    if (barcodeScanning) {
      setTimeout(() => scanBarcodeFrame(), 200);
    }
  }
}

// Lookup ISBN using multiple APIs with fallbacks
async function lookupISBN(isbn) {
  console.log('=== ISBN LOOKUP START ===');
  console.log('Original ISBN:', isbn);
  showToast(`🔍 Looking up: ${isbn}`);
  
  try {
    // Clean ISBN (remove hyphens, spaces)
    const cleanISBN = isbn.replace(/[^0-9X]/gi, '');
    console.log('Clean ISBN:', cleanISBN, 'Length:', cleanISBN.length);
    
    // If ISBN-10, convert to ISBN-13
    let isbn13 = cleanISBN;
    if (cleanISBN.length === 10) {
      isbn13 = convertISBN10to13(cleanISBN);
      console.log('Converted ISBN-10 to ISBN-13:', isbn13);
    }
    
    // Try multiple APIs in order of reliability
    const isbnsToTry = cleanISBN.length === 10 ? [isbn13, cleanISBN] : [cleanISBN];
    
    // 1. Try Google Books first (most comprehensive)
    for (const isbnToTry of isbnsToTry) {
      console.log('Trying Google Books with ISBN:', isbnToTry);
      const googleResult = await tryGoogleBooks(isbnToTry);
      if (googleResult) {
        console.log('✅ Google Books SUCCESS!');
        return;
      }
    }
    
    // 2. Try Open Library as backup
    for (const isbnToTry of isbnsToTry) {
      console.log('Trying Open Library with ISBN:', isbnToTry);
      const openLibResult = await tryOpenLibrary(isbnToTry);
      if (openLibResult) {
        console.log('✅ Open Library SUCCESS!');
        return;
      }
    }
    
    // 3. All APIs failed
    console.log('=== ALL LOOKUPS FAILED ===');
    showToast(`❌ ISBN ${cleanISBN} not in any database. Filling ISBN field - please enter title and author manually.`, 6000);
    document.getElementById('bookISBN').value = cleanISBN;
    
    // Show a helpful message in the title field
    document.getElementById('bookTitle').placeholder = 'Book not found - enter title manually';
    document.getElementById('bookAuthor').placeholder = 'Enter author manually';
    
  } catch (error) {
    console.error('ISBN lookup error:', error);
    showToast(`❌ Lookup error. ISBN saved - enter details manually.`, 5000);
    const cleanISBN = isbn.replace(/[^0-9X]/gi, '');
    document.getElementById('bookISBN').value = cleanISBN;
    document.getElementById('bookTitle').placeholder = 'Enter title manually';
    document.getElementById('bookAuthor').placeholder = 'Enter author manually';
  }
}

// Try Google Books API (most comprehensive)
async function tryGoogleBooks(isbn) {
  try {
    const url = `https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}`;
    console.log('Fetching Google Books:', url);
    
    const response = await fetch(url);
    const data = await response.json();
    console.log('Google Books response:', data);
    
    if (!data.items || data.items.length === 0) {
      return false;
    }
    
    const book = data.items[0].volumeInfo;
    console.log('✅ Google Books found book:', book);
    
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
    
    showToast('✅ Book found! Review and save.');
    return true;
    
  } catch (error) {
    console.error('Google Books error:', error);
    return false;
  }
}

// Try Open Library API
async function tryOpenLibrary(isbn) {
  try {
    const url = `https://openlibrary.org/isbn/${isbn}.json`;
    console.log('Fetching Open Library:', url);
    
    const response = await fetch(url);
    
    if (!response.ok) {
      return false;
    }
    
    const data = await response.json();
    console.log('✅ Open Library found book:', data);
    
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
        if (data.by_statement) {
          document.getElementById('bookAuthor').value = data.by_statement;
        }
      }
    }
    
    // Set ISBN
    document.getElementById('bookISBN').value = isbn;
    
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
    return true;
    
  } catch (error) {
    console.error('Open Library error:', error);
    return false;
  }
}

// Convert ISBN-10 to ISBN-13
function convertISBN10to13(isbn10) {
  const base = '978' + isbn10.substring(0, 9);
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(base[i]) * (i % 2 === 0 ? 1 : 3);
  }
  const checkDigit = (10 - (sum % 10)) % 10;
  return base + checkDigit;
}

// ============================================================
// ENHANCED OCR FOR TITLE/SPINE SCANNING
// ============================================================

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
  showToast('🔍 Enhancing image and reading text... (5-10 seconds)', 15000);
  
  // ============================================================
  // IMAGE PRE-PROCESSING for better OCR accuracy
  // ============================================================
  
  // Get image data
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  
  // 1. Convert to grayscale
  for (let i = 0; i < data.length; i += 4) {
    const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
    data[i] = gray;
    data[i + 1] = gray;
    data[i + 2] = gray;
  }
  
  // 2. Increase contrast (makes text darker, background lighter)
  const contrastFactor = 1.5;
  for (let i = 0; i < data.length; i += 4) {
    data[i] = Math.min(255, Math.max(0, contrastFactor * (data[i] - 128) + 128));
    data[i + 1] = Math.min(255, Math.max(0, contrastFactor * (data[i + 1] - 128) + 128));
    data[i + 2] = Math.min(255, Math.max(0, contrastFactor * (data[i + 2] - 128) + 128));
  }
  
  // 3. Apply sharpening (makes edges crisper)
  const sharpened = applySharpening(imageData, canvas.width, canvas.height);
  
  // Put processed image back on canvas
  ctx.putImageData(sharpened, 0, 0);
  
  const processedImage = canvas.toDataURL('image/png');
  
  // Process with Tesseract using optimized settings
  try {
    const { data: { text } } = await Tesseract.recognize(
      processedImage,
      'eng',
      {
        logger: m => {
          if (m.status === 'recognizing text') {
            const progress = Math.round(m.progress * 100);
            showToast(`📖 Reading text: ${progress}%`, 15000);
          }
        },
        // Optimized Tesseract config for book text
        tessedit_pageseg_mode: Tesseract.PSM.AUTO,
        tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 .,:;\'"-!?&'
      }
    );
    
    console.log('OCR Raw text:', text);
    
    // Split into lines and clean
    ocrLines = text
      .split('\n')
      .map(l => l.trim())
      .filter(l => l.length > 2) // Filter out very short lines
      .filter(l => !/^[^a-zA-Z]*$/.test(l)) // Filter out lines with no letters
      .filter(l => !l.match(/^[\W_]+$/)); // Filter out lines with only special chars
    
    console.log('Cleaned lines:', ocrLines);
    
    if (ocrLines.length === 0) {
      showToast('❌ Could not find readable text. Try again with better lighting or closer to the book.');
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

// Apply sharpening filter to enhance text edges
function applySharpening(imageData, width, height) {
  const data = imageData.data;
  const output = new ImageData(width, height);
  const outputData = output.data;
  
  // Sharpening kernel
  const kernel = [
    0, -1, 0,
    -1, 5, -1,
    0, -1, 0
  ];
  
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = (y * width + x) * 4;
      
      let r = 0, g = 0, b = 0;
      
      for (let ky = -1; ky <= 1; ky++) {
        for (let kx = -1; kx <= 1; kx++) {
          const kidx = ((y + ky) * width + (x + kx)) * 4;
          const kvalue = kernel[(ky + 1) * 3 + (kx + 1)];
          
          r += data[kidx] * kvalue;
          g += data[kidx + 1] * kvalue;
          b += data[kidx + 2] * kvalue;
        }
      }
      
      outputData[idx] = Math.min(255, Math.max(0, r));
      outputData[idx + 1] = Math.min(255, Math.max(0, g));
      outputData[idx + 2] = Math.min(255, Math.max(0, b));
      outputData[idx + 3] = 255;
    }
  }
  
  return output;
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
