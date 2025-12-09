// main.js
// Main application logic for Bookish Library

let sortField = null;
let sortDir = 'asc';
let currentDetailBook = null;

// DOM Elements - Filters
const searchInput = document.getElementById('searchInput');
const fictionFilter = document.getElementById('fictionFilter');
const genreFilter = document.getElementById('genreFilter');
const difficultyFilter = document.getElementById('difficultyFilter');
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
const scanBarcodeBtn = document.getElementById('scanBarcodeBtn');
const scanCoverBtn = document.getElementById('scanCoverBtn');
const aiClassifyBtn = document.getElementById('aiClassifyBtn');

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
  difficultyFilter.addEventListener('change', applyFilters);
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
  scanBarcodeBtn.addEventListener('click', handleScanBarcode);
  scanCoverBtn.addEventListener('click', handleScanCover);
  aiClassifyBtn.addEventListener('click', handleAIClassify);

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
  const diffVal = difficultyFilter.value;
  const statusVal = statusFilter.value;
  
  const wantAudible = formatCheckboxes.audible.checked;
  const wantKindle = formatCheckboxes.kindle.checked;
  const wantPhysical = formatCheckboxes.physical.checked;

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

    // Difficulty filter
    if (diffVal && book.difficulty !== diffVal) return false;

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
  if (book) {
    // Edit mode
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
    modalTitle.textContent = 'Add New Book';
    bookForm.reset();
    delete bookForm.dataset.editId;
  }
  
  bookModal.classList.add('open');
  bookModal.setAttribute('aria-hidden', 'false');
  document.getElementById('bookTitle').focus();
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
  if (!currentDetailBook) return;
  closeDetail();
  openBookModal(currentDetailBook);
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
  const books = DataManager.exportBooks();
  const json = JSON.stringify(books, null, 2);
  
  // Create download
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'bookish-library-export-' + new Date().toISOString().split('T')[0] + '.json';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  
  showToast('Library exported successfully!');
}

// Show toast notification
function showToast(message) {
  const toast = document.getElementById('toast');
  const toastMessage = document.getElementById('toastMessage');
  
  toastMessage.textContent = message;
  toast.classList.add('show');
  
  setTimeout(() => {
    toast.classList.remove('show');
  }, 3000);
}

// Handle barcode scanning
async function handleScanBarcode() {
  try {
    // Check if browser supports camera
    if (!('mediaDevices' in navigator) || !('getUserMedia' in navigator.mediaDevices)) {
      alert('Camera access is not supported in your browser. Please enter book details manually.');
      return;
    }

    showToast('Opening camera for barcode scanning...');
    
    // Request camera access
    const stream = await navigator.mediaDevices.getUserMedia({ 
      video: { facingMode: 'environment' } // Use back camera on mobile
    });
    
    // Create video element for camera feed
    const video = document.createElement('video');
    video.srcObject = stream;
    video.setAttribute('playsinline', true);
    video.play();
    
    // Create canvas for capturing frame
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    
    // Create a modal for camera view
    const cameraModal = createCameraModal(video, async () => {
      // Capture frame
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Stop camera
      stream.getTracks().forEach(track => track.stop());
      
      // Convert to base64
      const imageData = canvas.toDataURL('image/jpeg');
      
      // Close camera modal
      document.body.removeChild(cameraModal);
      
      // Use Claude API to extract barcode/ISBN
      await extractBookFromImage(imageData, 'barcode');
    }, () => {
      // Cancel - stop camera
      stream.getTracks().forEach(track => track.stop());
      document.body.removeChild(cameraModal);
    });
    
    document.body.appendChild(cameraModal);
    
  } catch (error) {
    console.error('Camera error:', error);
    alert('Could not access camera. Please check permissions or enter book details manually.');
  }
}

// Handle cover scanning (OCR)
async function handleScanCover() {
  try {
    if (!('mediaDevices' in navigator) || !('getUserMedia' in navigator.mediaDevices)) {
      alert('Camera access is not supported in your browser. Please enter book details manually.');
      return;
    }

    showToast('Opening camera for cover scanning...');
    
    const stream = await navigator.mediaDevices.getUserMedia({ 
      video: { facingMode: 'environment' }
    });
    
    const video = document.createElement('video');
    video.srcObject = stream;
    video.setAttribute('playsinline', true);
    video.play();
    
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    
    const cameraModal = createCameraModal(video, async () => {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      stream.getTracks().forEach(track => track.stop());
      
      const imageData = canvas.toDataURL('image/jpeg');
      
      document.body.removeChild(cameraModal);
      
      await extractBookFromImage(imageData, 'cover');
    }, () => {
      stream.getTracks().forEach(track => track.stop());
      document.body.removeChild(cameraModal);
    });
    
    document.body.appendChild(cameraModal);
    
  } catch (error) {
    console.error('Camera error:', error);
    alert('Could not access camera. Please check permissions or enter book details manually.');
  }
}

// Create camera modal UI
function createCameraModal(video, onCapture, onCancel) {
  const modal = document.createElement('div');
  modal.style.cssText = `
    position: fixed;
    inset: 0;
    background: black;
    z-index: 1000;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  `;
  
  video.style.cssText = `
    max-width: 100%;
    max-height: 80vh;
  `;
  
  const controls = document.createElement('div');
  controls.style.cssText = `
    position: absolute;
    bottom: 2rem;
    display: flex;
    gap: 1rem;
  `;
  
  const captureBtn = document.createElement('button');
  captureBtn.textContent = '📸 Capture';
  captureBtn.className = 'btn-primary';
  captureBtn.style.cssText = 'padding: 1rem 2rem; font-size: 1.1rem; border-radius: 999px;';
  captureBtn.onclick = onCapture;
  
  const cancelBtn = document.createElement('button');
  cancelBtn.textContent = '✕ Cancel';
  cancelBtn.className = 'btn-secondary';
  cancelBtn.style.cssText = 'padding: 1rem 2rem; font-size: 1.1rem; border-radius: 999px;';
  cancelBtn.onclick = onCancel;
  
  controls.appendChild(captureBtn);
  controls.appendChild(cancelBtn);
  
  modal.appendChild(video);
  modal.appendChild(controls);
  
  return modal;
}

// Extract book info from image using Claude API
async function extractBookFromImage(imageData, type) {
  showToast('Analyzing image with AI...');
  
  try {
    const base64Data = imageData.split(',')[1];
    
    const prompt = type === 'barcode' 
      ? 'Extract the ISBN or barcode number from this image. If you can identify the book, also provide the title and author.'
      : 'Extract the book title and author from this book cover image. Be as accurate as possible.';
    
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        messages: [{
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: 'image/jpeg',
                data: base64Data
              }
            },
            {
              type: 'text',
              text: prompt
            }
          ]
        }]
      })
    });
    
    const data = await response.json();
    const text = data.content[0].text;
    
    // Parse the response to extract title/author/ISBN
    await populateBookFieldsFromAI(text, type);
    
  } catch (error) {
    console.error('AI extraction error:', error);
    showToast('Could not extract book info. Please enter manually.');
  }
}

// Populate form fields from AI response
async function populateBookFieldsFromAI(aiResponse, type) {
  // Simple parsing - look for patterns like "Title: X" and "Author: Y"
  const titleMatch = aiResponse.match(/(?:title|book)[:\s]+([^\n]+)/i);
  const authorMatch = aiResponse.match(/(?:author|by)[:\s]+([^\n]+)/i);
  const isbnMatch = aiResponse.match(/(?:ISBN|isbn)[:\s]*([\d-]+)/i);
  
  if (titleMatch) {
    document.getElementById('bookTitle').value = titleMatch[1].trim();
  }
  
  if (authorMatch) {
    document.getElementById('bookAuthor').value = authorMatch[1].trim();
  }
  
  if (isbnMatch) {
    document.getElementById('bookISBN').value = isbnMatch[1].trim();
  }
  
  if (titleMatch || authorMatch) {
    showToast('Book info extracted! Review and save.');
    
    // Automatically trigger AI classification
    if (titleMatch && authorMatch) {
      await handleAIClassify();
    }
  } else {
    showToast('Could not extract book info. Please enter manually.');
  }
}

// Handle AI classification
async function handleAIClassify() {
  const title = document.getElementById('bookTitle').value.trim();
  const author = document.getElementById('bookAuthor').value.trim();
  
  if (!title || !author) {
    alert('Please enter title and author first.');
    return;
  }
  
  showToast('Classifying with AI...');
  
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 500,
        messages: [{
          role: 'user',
          content: `For the book "${title}" by ${author}, provide:
1. Genre (be specific, e.g., "Science Fiction", "Historical Fiction", "Literary Fiction", "Thriller", "Business", "History", "Science", "Philosophy", etc.)
2. Fiction or Nonfiction
3. Difficulty (Light, Moderate, or Dense)

Respond in this exact format:
Genre: [genre]
Type: [Fiction or Nonfiction]
Difficulty: [Light/Moderate/Dense]`
        }]
      })
    });
    
    const data = await response.json();
    const text = data.content[0].text;
    
    // Parse response
    const genreMatch = text.match(/Genre[:\s]+([^\n]+)/i);
    const typeMatch = text.match(/Type[:\s]+([^\n]+)/i);
    const difficultyMatch = text.match(/Difficulty[:\s]+([^\n]+)/i);
    
    if (genreMatch) {
      document.getElementById('bookGenre').value = genreMatch[1].trim();
    }
    
    if (typeMatch) {
      const type = typeMatch[1].trim();
      document.getElementById('bookFictionType').value = type.includes('Nonfiction') ? 'Nonfiction' : 'Fiction';
    }
    
    if (difficultyMatch) {
      document.getElementById('bookDifficulty').value = difficultyMatch[1].trim();
    }
    
    showToast('Book classified successfully!');
    
  } catch (error) {
    console.error('AI classification error:', error);
    showToast('Could not classify book. Please enter manually.');
  }
}

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
