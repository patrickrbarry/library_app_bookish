// main.js

// ----------------------
// State & persistence
// ----------------------
let library = [];

function loadLibrary() {
  try {
    const stored = localStorage.getItem(BOOKISH_STORAGE_KEY);
    if (stored) {
      library = JSON.parse(stored);
      return;
    }
  } catch (e) {
    console.warn("Error reading local storage, falling back to initial data.", e);
  }
  // fallback to seed
  library = Array.isArray(INITIAL_BOOKS) ? [...INITIAL_BOOKS] : [];
  saveLibrary();
}

function saveLibrary() {
  try {
    localStorage.setItem(BOOKISH_STORAGE_KEY, JSON.stringify(library));
  } catch (e) {
    console.warn("Error saving to local storage.", e);
  }
}

// ----------------------
// DOM helpers
// ----------------------
const $ = (id) => document.getElementById(id);

const searchInput = $("searchInput");
const statusFilter = $("statusFilter");
const formatFilter = $("formatFilter");
const clearFiltersButton = $("clearFiltersButton");
const statusLine = $("statusLine");
const totalBadge = $("totalBadge");
const filteredCountLabel = $("filteredCountLabel");
const tableBody = $("booksTableBody");

const scanButton = $("scanButton");
const stopScanButton = $("stopScanButton");
const cameraPanel = $("cameraPanel");
const cameraPreview = $("cameraPreview");

let currentScanner = null;
let scannerActive = false;

// ----------------------
// Filtering & rendering
// ----------------------
function getFilteredBooks() {
  const query = (searchInput.value || "").toLowerCase().trim();
  const statusVal = statusFilter.value;
  const formatVal = formatFilter.value;

  return library.filter((book) => {
    // text match
    if (query) {
      const haystack = [
        book.title,
        book.author,
        book.genre,
        book.notes,
        book.isbn
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(query)) return false;
    }

    if (statusVal !== "all" && book.status !== statusVal) return false;
    if (formatVal !== "all" && book.format !== formatVal) return false;

    return true;
  });
}

function formatFormatLabel(fmt) {
  switch (fmt) {
    case "audible":
      return "Audible";
    case "kindle":
      return "Kindle / eBook";
    case "physical":
      return "Physical";
    case "multiple":
      return "Multiple formats";
    default:
      return fmt || "—";
  }
}

function formatStatusChip(status) {
  const base = document.createElement("span");
  base.className = "chip chip-muted";
  const dot = document.createElement("span");
  dot.className = "chip-dot";
  base.appendChild(dot);

  const text = document.createElement("span");
  if (status === "read") {
    base.className = "chip chip-green";
    text.textContent = "Read";
  } else if (status === "reading") {
    text.textContent = "Reading";
  } else if (status === "unread") {
    text.textContent = "Unread";
  } else {
    text.textContent = status || "Unknown";
  }
  base.appendChild(text);
  return base;
}

function renderLibrary() {
  const books = getFilteredBooks();
  tableBody.innerHTML = "";

  books.forEach((book) => {
    const tr = document.createElement("tr");

    // Title & status
    const tdTitle = document.createElement("td");
    tdTitle.className = "title-cell";
    const titleDiv = document.createElement("div");
    titleDiv.textContent = book.title || "(Untitled)";
    tdTitle.appendChild(titleDiv);

    const metaDiv = document.createElement("div");
    metaDiv.className = "muted";
    const statusChip = formatStatusChip(book.status);
    metaDiv.appendChild(statusChip);

    if (book.genre) {
      const spacer = document.createTextNode(" · ");
      metaDiv.appendChild(spacer);
      metaDiv.appendChild(document.createTextNode(book.genre));
    }

    tdTitle.appendChild(metaDiv);

    // Author
    const tdAuthor = document.createElement("td");
    tdAuthor.textContent = book.author || "—";

    // Format
    const tdFormat = document.createElement("td");
    const fmt = book.format || "";
    if (fmt) {
      const chip = document.createElement("span");
      chip.className = "chip";
      const dot = document.createElement("span");
      dot.className = "chip-dot";
      chip.appendChild(dot);
      chip.appendChild(
        document.createTextNode(formatFormatLabel(fmt))
      );
      tdFormat.appendChild(chip);
    } else {
      tdFormat.textContent = "—";
    }

    // ISBN
    const tdIsbn = document.createElement("td");
    tdIsbn.className = "nowrap";
    tdIsbn.textContent = book.isbn || "—";

    tr.appendChild(tdTitle);
    tr.appendChild(tdAuthor);
    tr.appendChild(tdFormat);
    tr.appendChild(tdIsbn);

    tableBody.appendChild(tr);
  });

  // header badges
  totalBadge.textContent = `${library.length} book${library.length === 1 ? "" : "s"}`;
  filteredCountLabel.textContent =
    books.length === library.length
      ? `${books.length} showing`
      : `${books.length} showing of ${library.length}`;
}

function clearFilters() {
  searchInput.value = "";
  statusFilter.value = "all";
  formatFilter.value = "all";
  renderLibrary();
  setStatus("Filters cleared.");
}

// ----------------------
// Status line
// ----------------------
function setStatus(msg) {
  statusLine.innerHTML = msg
    ? msg.replace(/`([^`]+)`/g, "<code>$1</code>")
    : "";
}

// ----------------------
// Scanner & ISBN lookup
// ----------------------
async function lookupBookByIsbn(isbnRaw) {
  const cleaned = (isbnRaw || "").replace(/[^0-9X]/gi, "");
  if (!cleaned) {
    setStatus("I saw a barcode, but couldn’t make sense of the ISBN.");
    return;
  }

  setStatus(`Scanned ISBN <strong>${cleaned}</strong>. Looking up details…`);

  // If already in library, just surface it and don't hit API
  const existing = library.find((b) => b.isbn === cleaned);
  if (existing) {
    setStatus(
      `You already have <strong>${existing.title || "this book"}</strong> in your library.`
    );
    renderLibrary();
    return;
  }

  try {
    const url = `https://openlibrary.org/api/books?bibkeys=ISBN:${cleaned}&format=json&jscmd=data`;
    const resp = await fetch(url);
    const json = await resp.json();
    const key = `ISBN:${cleaned}`;
    const info = json[key];

    let title = "";
    let author = "";
    let publicationDate = "";

    if (info) {
      title = info.title || "";
      if (Array.isArray(info.authors) && info.authors[0]) {
        author = info.authors[0].name || "";
      }
      publicationDate = info.publish_date || "";
    }

    const newBook = {
      id: `isbn-${cleaned}-${Date.now()}`,
      title: title || "(Untitled)",
      author: author || "",
      status: "unread",
      format: "physical",
      genre: "", // you can later run your classifier to fill this
      notes: "",
      isbn: cleaned,
      publicationDate,
      addedAt: new Date().toISOString().slice(0, 10)
    };

    library.push(newBook);
    saveLibrary();
    renderLibrary();

    if (title) {
      setStatus(
        `Added <strong>${title}</strong>${author ? " by <strong>" + author + "</strong>" : ""}${
          publicationDate ? " (" + publicationDate + ")" : ""
        }.`
      );
    } else {
      setStatus(
        `ISBN <strong>${cleaned}</strong> added. I couldn’t find metadata, but it’s now in your library.`
      );
    }
  } catch (err) {
    console.error(err);
    setStatus(
      "I had trouble talking to Open Library. The ISBN was read, but I couldn’t fetch details."
    );
  }
}

async function startScanner() {
  if (scannerActive) return;

  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    alert("Camera access isn’t supported in this browser.");
    return;
  }

  if (!window.ZXingBrowser || !ZXingBrowser.BrowserMultiFormatReader) {
    alert("Barcode library did not load. Check your network connection.");
    return;
  }

  try {
    const reader = new ZXingBrowser.BrowserMultiFormatReader();
    currentScanner = reader;
    scannerActive = true;

    cameraPanel.style.display = "block";
    scanButton.disabled = true;
    stopScanButton.style.display = "inline-flex";
    setStatus("Starting camera…");

    const devices =
      (await ZXingBrowser.BrowserCodeReader.listVideoInputDevices()) || [];
    if (!devices.length) {
      setStatus("I couldn’t find a camera on this device.");
      stopScanner();
      return;
    }

    const backCam =
      devices.find((d) => /back|environment/i.test(d.label)) || devices[0];

    setStatus("Point your camera at the barcode on the back cover…");

    reader
      .decodeOnceFromVideoDevice(backCam.deviceId, cameraPreview)
      .then((result) => {
        const text =
          result && (result.text || (result.getText && result.getText()));
        stopScanner();
        if (!text) {
          setStatus("I saw a barcode, but couldn’t read it clearly. Try again?");
          return;
        }
        lookupBookByIsbn(text);
      })
      .catch((err) => {
        console.error("Decode error", err);
        stopScanner();
        setStatus(
          "I couldn’t read a barcode. Try moving closer, adjusting the angle, or checking the lighting."
        );
      });
  } catch (err) {
    console.error("Error starting scanner", err);
    setStatus("Something went sideways when trying to start the camera.");
    stopScanner();
  }
}

function stopScanner() {
  if (currentScanner) {
    try {
      currentScanner.reset();
    } catch (e) {
      console.warn("Error resetting scanner", e);
    }
    currentScanner = null;
  }
  scannerActive = false;
  cameraPanel.style.display = "none";
  scanButton.disabled = false;
  stopScanButton.style.display = "none";
}

// ----------------------
// Event wiring
// ----------------------
document.addEventListener("DOMContentLoaded", () => {
  loadLibrary();
  renderLibrary();
  setStatus("Ready when you are. Try scanning a book or searching your shelves.");

  searchInput.addEventListener("input", () => {
    renderLibrary();
  });

  statusFilter.addEventListener("change", () => {
    renderLibrary();
  });

  formatFilter.addEventListener("change", () => {
    renderLibrary();
  });

  clearFiltersButton.addEventListener("click", () => {
    clearFilters();
  });

  scanButton.addEventListener("click", () => {
    startScanner();
  });

  stopScanButton.addEventListener("click", () => {
    setStatus("Scanner stopped for now.");
    stopScanner();
  });
});
