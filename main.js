// MAIN.JS – Bookish (warm) with reusable barcode scanner
// -----------------------------------------------

// 1. Library data

const initialBooks = (window.BOOKS && Array.isArray(window.BOOKS))
  ? window.BOOKS
  : [];

let library = [...initialBooks];

// 2. DOM references

const tableBody = document.getElementById('booksTableBody');
const emptyState = document.getElementById('emptyState');
const totalBadge = document.getElementById('totalBadge');
const visibleCountMeta = document.getElementById('visibleCountMeta');

const searchInput = document.getElementById('searchInput');
const statusFilterGroup = document.getElementById('statusFilterGroup');

const scanButton = document.getElementById('scanButton');
const stopButton = document.getElementById('stopButton');
const scannerStatus = document.getElementById('scannerStatus');
const videoWrap = document.getElementById('videoWrap');
const videoElem = document.getElementById('preview');

// ZXing
let codeReader = null;
let isScanning = false;

// Current filters
let currentStatusFilter = 'all';
let currentSearchTerm = '';

// -----------------------------------------------
// Library rendering & filtering
// -----------------------------------------------

function normalizeStatus(raw) {
  if (!raw) return 'unknown';

  const s = String(raw).toLowerCase();
  if (s.includes('unread') || s.includes('to read') || s === 'tbr') return 'unread';
  if (s.includes('reading') || s.includes('in progress') || s.includes('current')) return 'reading';
  if (s.includes('read') || s.includes('finished') || s.includes('complete')) return 'read';

  return 'unknown';
}

function normalizeFormat(raw) {
  if (!raw) return 'unknown';
  const s = String(raw).toLowerCase();
  if (s.includes('audible') || s.includes('audio')) return 'audio';
  if (s.includes('kindle') || s.includes('ebook') || s.includes('e-book')) return 'kindle';
  if (s.includes('physical') || s.includes('paper') || s.includes('hard') || s.includes('print')) return 'physical';
  return raw;
}

function getYearFromBook(book) {
  if (book.year) return book.year;
  if (book.publication_date) {
    const match = String(book.publication_date).match(/\b(\d{4})\b/);
    if (match) return match[1];
  }
  if (book.publishDate) {
    const match = String(book.publishDate).match(/\b(\d{4})\b/);
    if (match) return match[1];
  }
  return '';
}

function renderLibrary() {
  const term = currentSearchTerm.trim().toLowerCase();

  const filtered = library.filter((book) => {
    const statusNorm = normalizeStatus(book.status || book.read_status || '');
    const matchesStatus =
      currentStatusFilter === 'all' || statusNorm === currentStatusFilter;

    if (!matchesStatus) return false;

    if (!term) return true;

    const title = (book.title || '').toLowerCase();
    const author = (book.author || '').toLowerCase();
    return title.includes(term) || author.includes(term);
  });

  tableBody.innerHTML = '';

  if (!filtered.length) {
    emptyState.style.display = 'block';
  } else {
    emptyState.style.display = 'none';
  }

  filtered.forEach((book) => {
    const tr = document.createElement('tr');

    const statusNorm = normalizeStatus(book.status || book.read_status || '');
    const formatNorm = normalizeFormat(book.format || book.medium || '');
    const year = getYearFromBook(book);

    // Title
    const tdTitle = document.createElement('td');
    tdTitle.className = 'title-cell';
    tdTitle.textContent = book.title || '';
    tr.appendChild(tdTitle);

    // Author
    const tdAuthor = document.createElement('td');
    tdAuthor.className = 'author-cell';
    tdAuthor.textContent = book.author || '';
    tr.appendChild(tdAuthor);

    // Status
    const tdStatus = document.createElement('td');
    const statusTag = document.createElement('span');
    statusTag.classList.add('tag');
    if (statusNorm === 'read') statusTag.classList.add('tag-status-read');
    if (statusNorm === 'unread' || statusNorm === 'reading') statusTag.classList.add('tag-status-unread');
    statusTag.textContent =
      statusNorm === 'read'
        ? 'Finished'
        : statusNorm === 'reading'
        ? 'In progress'
        : statusNorm === 'unread'
        ? 'Unread'
        : (book.status || '—');
    tdStatus.appendChild(statusTag);
    tr.appendChild(tdStatus);

    // Format
    const tdFormat = document.createElement('td');
    const formatTag = document.createElement('span');
    formatTag.classList.add('tag', 'tag-format');
    formatTag.textContent =
      formatNorm === 'audio'
        ? 'Audio'
        : formatNorm === 'kindle'
        ? 'Kindle'
        : formatNorm === 'physical'
        ? 'Physical'
        : (book.format || '—');
    tdFormat.appendChild(formatTag);
    tr.appendChild(tdFormat);

    // Year
    const tdYear = document.createElement('td');
    tdYear.textContent = year || '—';
    tr.appendChild(tdYear);

    tableBody.appendChild(tr);
  });

  // badges
  totalBadge.textContent = `${library.length} book${library.length === 1 ? '' : 's'}`;
  visibleCountMeta.textContent = `${filtered.length} showing`;
}

// -----------------------------------------------
// Filter + search wiring
// -----------------------------------------------

searchInput.addEventListener('input', () => {
  currentSearchTerm = searchInput.value;
  renderLibrary();
});

statusFilterGroup.addEventListener('click', (evt) => {
  const pill = evt.target.closest('.pill');
  if (!pill) return;

  const status = pill.getAttribute('data-status');
  if (!status) return;

  currentStatusFilter = status;

  Array.from(statusFilterGroup.querySelectorAll('.pill')).forEach((el) => {
    el.classList.toggle('active', el === pill);
  });

  renderLibrary();
});

// -----------------------------------------------
// Scanner helpers
// -----------------------------------------------

function setScannerStatus(text, emphasize) {
  if (!scannerStatus) return;
  if (emphasize) {
    scannerStatus.innerHTML = text;
  } else {
    scannerStatus.textContent = text;
  }
}

function showVideo(show) {
  if (show) {
    videoWrap.style.display = 'block';
  } else {
    videoWrap.style.display = 'none';
  }
}

function addOrUpdateBook(book) {
  const isbn = (book.isbn || '').trim();
  if (!isbn) {
    library.push(book);
  } else {
    const existingIndex = library.findIndex((b) => (b.isbn || '').trim() === isbn);
    if (existingIndex >= 0) {
      library[existingIndex] = { ...library[existingIndex], ...book };
    } else {
      library.push(book);
    }
  }
  renderLibrary();
}

async function lookupBookByIsbn(isbnRaw) {
  const isbn = (isbnRaw || '').replace(/[^0-9X]/gi, '');
  if (!isbn) {
    setScannerStatus('Barcode detected, but ISBN was not readable. Try again closer to the code.');
    return;
  }

  setScannerStatus(`Scanned ISBN <strong>${isbn}</strong>. Looking up details…`, true);

  try {
    const url = `https://openlibrary.org/api/books?bibkeys=ISBN:${isbn}&format=json&jscmd=data`;
    const resp = await fetch(url);
    const json = await resp.json();
    const key = `ISBN:${isbn}`;
    const info = json[key];

    if (!info) {
      setScannerStatus(
        `No metadata found for ISBN <strong>${isbn}</strong>. A blank entry was added so you can fill it in.`,
        true
      );
      addOrUpdateBook({ isbn, title: '', author: '', publishDate: '' });
      return;
    }

    const title = info.title || '';
    const author = (info.authors && info.authors[0] && info.authors[0].name) || '';
    const publishDate = info.publish_date || '';

    addOrUpdateBook({
      isbn,
      title,
      author,
      publishDate,
      format: 'physical',
      status: 'unread',
    });

    const year = publishDate && publishDate.match(/\b(\d{4})\b/)
      ? publishDate.match(/\b(\d{4})\b/)[1]
      : '';

    setScannerStatus(
      `Added <strong>“${title || 'Untitled'}”</strong> by ${author
