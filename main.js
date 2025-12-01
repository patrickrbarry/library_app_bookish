
let sortField = null;
let sortDir = 'asc';

const data = Array.isArray(LIBRARY_DATA) ? LIBRARY_DATA : [];

const searchInput = document.getElementById('searchInput');
const fictionFilter = document.getElementById('fictionFilter');
const genreFilter = document.getElementById('genreFilter');
const difficultyFilter = document.getElementById('difficultyFilter');
const audibleFilter = document.getElementById('audibleFilter');
const kindleFilter = document.getElementById('kindleFilter');
const physicalFilter = document.getElementById('physicalFilter');

const tbody = document.querySelector('#libraryTable tbody');
const headerCells = document.querySelectorAll('#libraryTable thead th[data-field]');
const countShownEl = document.getElementById('countShown');
const countTotalEl = document.getElementById('countTotal');

const detailSheet = document.getElementById('detailSheet');
const detailBackdrop = document.getElementById('detailBackdrop');
const detailClose = document.getElementById('detailClose');
const detailTitle = document.getElementById('detailTitle');
const detailAuthor = document.getElementById('detailAuthor');
const detailMeta = document.getElementById('detailMeta');
const detailFormats = document.getElementById('detailFormats');
const detailTags = document.getElementById('detailTags');
const amazonOpen = document.getElementById('amazonOpen');
const amazonCopy = document.getElementById('amazonCopy');

let currentDetailRow = null;

// Populate genre filter
(function populateGenres() {
  const genres = new Set();
  data.forEach(row => {
    const g = row.Primary_Genre || '';
    if (g && g !== 'Unknown') genres.add(g);
  });
  Array.from(genres).sort().forEach(g => {
    const opt = document.createElement('option');
    opt.value = g;
    opt.textContent = g;
    genreFilter.appendChild(opt);
  });
})();

function applyFilters() {
  const term = (searchInput.value || '').toLowerCase().trim();
  const fictionVal = fictionFilter.value;
  const genreVal = genreFilter.value;
  const diffVal = difficultyFilter.value;
  const wantAudible = audibleFilter.checked;
  const wantKindle = kindleFilter.checked;
  const wantPhysical = physicalFilter.checked;

  let filtered = data.filter(row => {
    if (term) {
      const haystack = [
        row.Title || '',
        row.Author || '',
        row.Primary_Genre || '',
        row.Fiction_Nonfiction || ''
      ].join(' ').toLowerCase();
      if (!haystack.includes(term)) return false;
    }

    if (fictionVal && (row.Fiction_Nonfiction || '') !== fictionVal) return false;
    if (genreVal && (row.Primary_Genre || '') !== genreVal) return false;
    if (diffVal && (row.Difficulty || '') !== diffVal) return false;

    if (wantAudible && String(row.Has_Audible || '').toLowerCase() !== 'checked') return false;
    if (wantKindle && String(row.Has_Kindle || '').toLowerCase() !== 'checked') return false;
    if (wantPhysical && String(row.Has_Physical || '').toLowerCase() !== 'checked') return false;

    return true;
  });

  if (sortField) {
    filtered.sort((a, b) => {
      const av = (a[sortField] || '').toString().toLowerCase();
      const bv = (b[sortField] || '').toString().toLowerCase();
      if (av < bv) return sortDir === 'asc' ? -1 : 1;
      if (av > bv) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
  }

  renderRows(filtered);
}

function renderRows(rows) {
  tbody.innerHTML = '';
  rows.forEach(row => {
    const tr = document.createElement('tr');

    const titleTd = document.createElement('td');
    titleTd.textContent = row.Title || '';
    tr.appendChild(titleTd);

    const authorTd = document.createElement('td');
    authorTd.textContent = row.Author || '';
    tr.appendChild(authorTd);

    const genreTd = document.createElement('td');
    const g = row.Primary_Genre || '';
    const genreSpan = document.createElement('span');
    genreSpan.className = 'pill';
    genreSpan.textContent = g || '';
    genreTd.appendChild(genreSpan);
    tr.appendChild(genreTd);

    const typeTd = document.createElement('td');
    const type = row.Fiction_Nonfiction || '';
    if (type) {
      const pill = document.createElement('span');
      pill.className = 'pill ' + (type === 'Fiction' ? 'fiction' : 'nonfiction');
      pill.textContent = type;
      typeTd.appendChild(pill);
    }
    tr.appendChild(typeTd);

    const statusTd = document.createElement('td');
    const status = row.Read_Status || '';
    if (status) {
      const badge = document.createElement('span');
      badge.className = 'badge ' + status.toLowerCase();
      badge.textContent = status;
      statusTd.appendChild(badge);
    }
    tr.appendChild(statusTd);

    const acquiredTd = document.createElement('td');
    acquiredTd.textContent = row.First_Acquired || '';
    tr.appendChild(acquiredTd);

    tr.addEventListener('click', () => openDetail(row));

    tbody.appendChild(tr);
  });

  countShownEl.textContent = rows.length + ' shown';
  countTotalEl.textContent = data.length + ' total';
}

function openDetail(row) {
  currentDetailRow = row;
  detailTitle.textContent = row.Title || '';
  detailAuthor.textContent = row.Author ? 'by ' + row.Author : '';

  const bits = [];
  if (row.Fiction_Nonfiction) bits.push(row.Fiction_Nonfiction);
  if (row.Primary_Genre) bits.push(row.Primary_Genre);
  if (row.Difficulty) bits.push(row.Difficulty + ' read');
  if (row.First_Acquired) bits.push('Acquired: ' + row.First_Acquired);

  detailMeta.textContent = bits.join(' • ');

  const formats = [];
  if (String(row.Has_Audible || '').toLowerCase() === 'checked') formats.push('Audible');
  if (String(row.Has_Kindle || '').toLowerCase() === 'checked') formats.push('Kindle');
  if (String(row.Has_Physical || '').toLowerCase() === 'checked') formats.push('Physical');
  detailFormats.textContent = formats.length ? ('Formats: ' + formats.join(', ')) : 'Formats: —';

  const tagBits = [];
  if ((row.Read_Status || '').toLowerCase() === 'read') tagBits.push('read');
  if ((row.Read_Status || '').toLowerCase() === 'unread') tagBits.push('unread');
  if (formats.length) tagBits.push(...formats.map(f => f.toLowerCase()));
  detailTags.innerHTML = '';
  tagBits.forEach(t => {
    const span = document.createElement('span');
    span.textContent = t;
    detailTags.appendChild(span);
  });

  detailSheet.classList.add('open');
  detailSheet.setAttribute('aria-hidden', 'false');
}

function closeDetail() {
  detailSheet.classList.remove('open');
  detailSheet.setAttribute('aria-hidden', 'true');
  currentDetailRow = null;
}

detailBackdrop.addEventListener('click', closeDetail);
detailClose.addEventListener('click', closeDetail);
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeDetail();
});

function buildAmazonUrl(row) {
  const title = row.Title || '';
  const author = row.Author || '';
  const query = encodeURIComponent((title + ' ' + author).trim());
  return 'https://www.amazon.com/s?k=' + query;
}

amazonOpen.addEventListener('click', () => {
  if (!currentDetailRow) return;
  window.open(buildAmazonUrl(currentDetailRow), '_blank');
});

amazonCopy.addEventListener('click', async () => {
  if (!currentDetailRow) return;
  const url = buildAmazonUrl(currentDetailRow);
  if (navigator.clipboard && navigator.clipboard.writeText) {
    try {
      await navigator.clipboard.writeText(url);
      alert('Amazon link copied to clipboard.');
    } catch (e) {
      console.log('Clipboard failed', e);
      window.prompt('Copy this Amazon link:', url);
    }
  } else {
    window.prompt('Copy this Amazon link:', url);
  }
});

[searchInput, fictionFilter, genreFilter, difficultyFilter,
 audibleFilter, kindleFilter, physicalFilter].forEach(el => {
  el.addEventListener('input', applyFilters);
  el.addEventListener('change', applyFilters);
});

// Sorting
headerCells.forEach(th => {
  th.addEventListener('click', () => {
    const field = th.getAttribute('data-field');
    if (!field) return;
    if (sortField === field) {
      sortDir = sortDir === 'asc' ? 'desc' : 'asc';
    } else {
      sortField = field;
      sortDir = 'asc';
    }
    headerCells.forEach(h => h.classList.remove('sort-asc', 'sort-desc'));
    th.classList.add(sortDir === 'asc' ? 'sort-asc' : 'sort-desc');
    applyFilters();
  });
});

applyFilters();
