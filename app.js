// ========================================================
// SECURITY KEY & ENDPOINT MAPPING
// ========================================================
const API_URL =
  "https://script.google.com/macros/s/AKfycbxZxJENZlTYzPgdXeM7bAyGdqVUnv-fJUnRVG-6e3PwW5wPPnf4Ef9fmAUIPrp4qxMiPQ/exec";
const CORRECT_PASSCODE = "4177"; // e.g., "1234"

let compressedImageBase64 = "";

// Boot initialization runtime hooks
document.addEventListener("DOMContentLoaded", () => {
  initAppSecurity();
  initNavigationAndForm();
});

// ========================================================
// CORE SECURITY LAYER WITH PERSISTENT SESSION MEMORY
// ========================================================
function initAppSecurity() {
  const lockScreen = document.getElementById("lock-screen");
  const mainApp = document.getElementById("main-app");
  const passcodeInput = document.getElementById("passcode-input");
  const loginBtn = document.getElementById("login-btn");
  const errorMsg = document.getElementById("error-message");

  // Session Check: If previously logged in, skip lock screen automatically
  if (localStorage.getItem("app_unlocked") === "true") {
    lockScreen.classList.add("hidden");
    mainApp.classList.remove("hidden");
    loadGalleryData();
  }

  // Handle Action Button Submission Click
  loginBtn.addEventListener("click", () => {
    checkPasscode(passcodeInput, lockScreen, mainApp, errorMsg);
  });

  // Handle Mobile Virtual Keyboard 'Enter/Go' Button Action
  passcodeInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      checkPasscode(passcodeInput, lockScreen, mainApp, errorMsg);
    }
  });
}

function checkPasscode(input, lockView, appView, errorView) {
  if (input.value === CORRECT_PASSCODE) {
    // Write login validation state flag to persistent browser cache memory
    localStorage.setItem("app_unlocked", "true");

    errorView.classList.add("hidden");
    lockView.classList.add("hidden");
    appView.classList.remove("hidden");
    input.value = "";

    loadGalleryData();
  } else {
    errorView.classList.remove("hidden");
    input.value = "";
    input.style.borderColor = "var(--error-color)";
    setTimeout(() => {
      input.style.borderColor = "#e8dedf";
    }, 500);
  }
}

// ========================================================
// VIEW ROUTING NAVIGATION & FILE HANDLING LOGIC
// ========================================================
function initNavigationAndForm() {
  const galleryView = document.getElementById("gallery-view");
  const formView = document.getElementById("form-view");
  const navAddBtn = document.getElementById("nav-add-btn");
  const formCancelBtn = document.getElementById("form-cancel-btn");
  const formSubmitBtn = document.getElementById("form-submit-btn");
  const fileInput = document.getElementById("input-file");
  const imagePreview = document.getElementById("image-preview");
  const keychainForm = document.getElementById("keychain-form");

  // Router View Controls
  navAddBtn.addEventListener("click", () => {
    galleryView.classList.add("hidden");
    formView.classList.remove("hidden");
    document.getElementById("input-date").valueAsDate = new Date();
  });

  formCancelBtn.addEventListener("click", () => {
    keychainForm.reset();
    imagePreview.innerHTML = "";
    compressedImageBase64 = "";
    formView.classList.add("hidden");
    galleryView.classList.remove("hidden");
  });

  // Camera File Capture Process & Compressed Canvas Scaling Routine
  fileInput.addEventListener("change", (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        // Hard constraint image max limits for quick network processing
        const MAX_WIDTH = 800;
        let width = img.width;
        let height = img.height;

        if (width > MAX_WIDTH) {
          height = Math.round((height * MAX_WIDTH) / width);
          width = MAX_WIDTH;
        }

        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);

        // Convert file asset into an optimized lightweight Base64 string stream
        compressedImageBase64 = canvas.toDataURL("image/jpeg", 0.75);
        imagePreview.innerHTML = `<img src="${compressedImageBase64}" alt="Preview">`;
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });

  // Form Cloud Upload Submission Management
  formSubmitBtn.addEventListener("click", () => {
    const name = document.getElementById("input-name").value.trim();
    const location = document.getElementById("input-location").value.trim();
    const date = document.getElementById("input-date").value;
    const notes = document.getElementById("input-notes").value.trim();

    if (!name || !location || !date) {
      alert("Please fill out Name, Location, and Date fields before saving.");
      return;
    }

    if (!compressedImageBase64) {
      alert("Please take or select a photo of the keychain first!");
      return;
    }

    formSubmitBtn.disabled = true;
    formSubmitBtn.innerText = "Saving to cloud... ☁️";

    const payload = {
      name: name,
      location: location,
      date: date,
      imageUrl: compressedImageBase64,
      notes: notes,
    };

    fetch(API_URL, {
      method: "POST",
      mode: "no-cors",
      cache: "no-cache",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
      .then(() => {
        alert("Success! Keychain saved into our travel catalog.");
        keychainForm.reset();
        imagePreview.innerHTML = "";
        compressedImageBase64 = "";
        formView.classList.add("hidden");
        galleryView.classList.remove("hidden");
        loadGalleryData();
      })
      .catch((err) => {
        console.error(err);
        alert("Network saving error. Please try uploading again.");
      })
      .finally(() => {
        formSubmitBtn.disabled = false;
        formSubmitBtn.innerText = "Save to Catalog";
      });
  });
}

// ========================================================
// DATABASE FETCH & FEED RENDER ROUTINE
// ========================================================
function loadGalleryData() {
  const grid = document.getElementById("gallery-grid");

  fetch(API_URL)
    .then((res) => res.json())
    .then((data) => {
      // Flush original layout markup loaders
      grid.innerHTML = "";

      if (!data || data.length === 0) {
        grid.innerHTML = `<div class="empty-text">No keychains saved yet. Tap ＋ to start!</div>`;
        return;
      }

      // Read database list in reverse order so newest acquisitions appear first
      data.reverse().forEach((item) => {
        const card = document.createElement("div");
        card.className = "keychain-card";

        const imageSegment = item.imageurl
          ? `<img src="${item.imageurl}" class="card-img" alt="Keychain image" loading="lazy">`
          : `<div class="card-img-placeholder">🔑</div>`;

        const notesSegment = item.notes
          ? `<p class="meta-notes">"${item.notes}"</p>`
          : "";

        card.innerHTML = `
          ${imageSegment}
          <div class="card-content">
            <h3>${item.name}</h3>
            <p class="meta-location">📍 ${item.location}</p>
            <p class="meta-date">📅 ${item.date}</p>
            ${notesSegment}
          </div>
        `;
        grid.appendChild(card);
      });
    })
    .catch((err) => {
      console.error(err);
      grid.innerHTML = `<div class="empty-text">Error loading database. Please pull down to refresh.</div>`;
    });
}
