// ========================================================
// REPO CONFIGURATION & CLOUD APIS
// ========================================================
const API_URL =
  "https://script.google.com/macros/s/AKfycbxPoyWNVcpBaFSJmTm1BoZTd01EfouS13emZPQ2lJvCK5MyW8zMlgQ-0LyYCWU85KFjOw/exec";

const CORRECT_PASSCODE = "4177";
const CLOUDINARY_CLOUD_NAME = "xzpkydjm";
const CLOUDINARY_PRESET = "keychain_preset";

let localImageFileBlob = null;
let activeDateMode = "today"; // Tracks choices: 'today', 'custom', 'unknown'

// Initialization Hook
document.addEventListener("DOMContentLoaded", () => {
  initAppSecurity();
  initNavigationAndForm();
  initFocusModalEvents();
  initProfileDropdown();
  initDateToggleControl();
});

// ========================================================
// SECURITY LAYER WITH PERSISTENT MEMORY
// ========================================================
function initAppSecurity() {
  const lockScreen = document.getElementById("lock-screen");
  const mainApp = document.getElementById("main-app");
  const passcodeInput = document.getElementById("passcode-input");
  const loginBtn = document.getElementById("login-btn");
  const errorMsg = document.getElementById("error-message");

  if (localStorage.getItem("app_unlocked") === "true") {
    lockScreen.classList.add("hidden");
    mainApp.classList.remove("hidden");
    loadGalleryData();
  }

  loginBtn.addEventListener("click", () => {
    checkPasscode(passcodeInput, lockScreen, mainApp, errorMsg);
  });

  passcodeInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      checkPasscode(passcodeInput, lockScreen, mainApp, errorMsg);
    }
  });

  // LOGOUT INTERACTION
  document.getElementById("logout-btn").addEventListener("click", () => {
    localStorage.removeItem("app_unlocked");
    document.getElementById("profile-menu-content").classList.add("hidden");
    mainApp.classList.add("hidden");
    lockScreen.classList.remove("hidden");
  });
}

function checkPasscode(input, lockView, appView, errorView) {
  if (input.value === CORRECT_PASSCODE) {
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
// PROFILE MENU POPOVER DROPDOWN INTERACTION CONTROLLER
// ========================================================
function initProfileDropdown() {
  const trigger = document.getElementById("profile-menu-btn");
  const content = document.getElementById("profile-menu-content");

  trigger.addEventListener("click", (e) => {
    e.stopPropagation();
    content.classList.toggle("hidden");
  });

  // Close the menu if she taps anywhere else on screen
  document.addEventListener("click", () => {
    content.classList.add("hidden");
  });
}

// ========================================================
// DATE SELECTION TOGGLE SEGMENT SEGREGATION ROUTINE
// ========================================================
function initDateToggleControl() {
  const btnToday = document.getElementById("date-mode-today");
  const btnCustom = document.getElementById("date-mode-custom");
  const btnUnknown = document.getElementById("date-mode-unknown");
  const customContainer = document.getElementById("custom-date-container");
  const dateInput = document.getElementById("input-date");

  function setMode(mode) {
    activeDateMode = mode;
    btnToday.classList.remove("active");
    btnCustom.classList.remove("active");
    btnUnknown.classList.remove("active");
    customContainer.style.display = "none";

    if (mode === "today") {
      btnToday.classList.add("active");
    } else if (mode === "custom") {
      btnCustom.classList.add("active");
      customContainer.style.display = "block";
      if (!dateInput.value) dateInput.valueAsDate = new Date();
    } else if (mode === "unknown") {
      btnUnknown.classList.add("active");
    }
  }

  btnToday.addEventListener("click", () => setMode("today"));
  btnCustom.addEventListener("click", () => setMode("custom"));
  btnUnknown.addEventListener("click", () => setMode("unknown"));
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

  navAddBtn.addEventListener("click", () => {
    galleryView.classList.add("hidden");
    formView.classList.remove("hidden");
    // Reset date toggle choice back to 'today' default state upon opening
    document.getElementById("date-mode-today").click();
  });

  formCancelBtn.addEventListener("click", () => {
    keychainForm.reset();
    imagePreview.innerHTML = "";
    localImageFileBlob = null;
    formView.classList.add("hidden");
    galleryView.classList.remove("hidden");
  });

  fileInput.addEventListener("change", (event) => {
    const file = event.target.files[0];
    if (!file) return;

    localImageFileBlob = file;
    const reader = new FileReader();
    reader.onload = (e) => {
      imagePreview.innerHTML = `<img src="${e.target.result}" alt="Preview">`;
    };
    reader.readAsDataURL(file);
  });

  formSubmitBtn.addEventListener("click", async () => {
    const name = document.getElementById("input-name").value.trim();
    const location =
      document.getElementById("input-location").value.trim() || "Unknown";
    const notes = document.getElementById("input-notes").value.trim() || "";

    // Name validation check (the only strictly required field now)
    if (!name) {
      alert("Please provide a name for this keychain entry.");
      return;
    }

    // Resolve structural payload string based on date segmented choice
    let dateFinalString = "Unknown";
    if (activeDateMode === "today") {
      const today = new Date();
      dateFinalString = today.toISOString().split("T")[0]; // Format standard YYYY-MM-DD
    } else if (activeDateMode === "custom") {
      const selectedCustomDate = document.getElementById("input-date").value;
      if (!selectedCustomDate) {
        alert("Please choose your customized calendar date.");
        return;
      }
      dateFinalString = selectedCustomDate;
    }

    formSubmitBtn.disabled = true;
    formSubmitBtn.innerText = "Processing Data... ⏳";

    try {
      let secureCDNImageUrl = "";

      // Image cloud sync pipeline executes ONLY if an image was selected
      if (localImageFileBlob) {
        formSubmitBtn.innerText = "Uploading Photo... 📸";
        const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;
        const formData = new FormData();
        formData.append("file", localImageFileBlob);
        formData.append("upload_preset", CLOUDINARY_PRESET);

        const cloudResponse = await fetch(cloudinaryUrl, {
          method: "POST",
          body: formData,
        });
        if (!cloudResponse.ok)
          throw new Error("Cloudinary media upload failed");
        const cloudData = await cloudResponse.json();
        secureCDNImageUrl = cloudData.secure_url;
      }

      formSubmitBtn.innerText = "Saving to collection... ☁️";

      const payload = {
        name: name,
        location: location,
        date: dateFinalString,
        imageUrl: secureCDNImageUrl, // Blank string if skipped
        notes: notes,
      };

      await fetch(API_URL, {
        method: "POST",
        mode: "no-cors",
        cache: "no-cache",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      alert("Success! Keychain catalog updated.");
      keychainForm.reset();
      imagePreview.innerHTML = "";
      localImageFileBlob = null;
      formView.classList.add("hidden");
      galleryView.classList.remove("hidden");
      loadGalleryData();
    } catch (err) {
      console.error(err);
      alert(
        "Process stopped. Storage update sequence encountered a pipeline error.",
      );
    } finally {
      formSubmitBtn.disabled = false;
      formSubmitBtn.innerText = "Save to Catalog";
    }
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
      grid.innerHTML = "";

      if (!data || data.length === 0) {
        grid.innerHTML = `<div class="empty-text">No keychains saved yet. Tap Add to start!</div>`;
        return;
      }

      data.reverse().forEach((item) => {
        const card = document.createElement("div");
        card.className = "keychain-card";

        const imageSegment = item.imageurl
          ? `<img src="${item.imageurl}" class="card-img" alt="Keychain image" loading="lazy">`
          : `<div class="card-img-placeholder">🔑</div>`;

        // COMPACT DESIGN: The card thumbnail strictly renders ONLY image and title name
        card.innerHTML = `
          ${imageSegment}
          <div class="card-content">
            <h3>${item.name}</h3>
          </div>
        `;

        card.addEventListener("click", () => {
          openFocusMode(item);
        });

        grid.appendChild(card);
      });
    })
    .catch((err) => {
      console.error(err);
      grid.innerHTML = `<div class="empty-text">Error loading database. Please try reloading.</div>`;
    });
}

// ========================================================
// DETAIL CARD MODAL FOCUS VIEW CONTROLLER
// ========================================================
function openFocusMode(item) {
  document.getElementById("focusImage").src = item.imageurl || "";
  document.getElementById("focusName").innerText =
    item.name || "Unnamed Keychain";

  // Displays historical metadata ONLY in individual item details layout view mode
  document.getElementById("focusLocation").innerText =
    `From: ${item.location || "Unknown"}`;
  document.getElementById("focusDate").innerText =
    `📅 ${item.date || "Unknown"}`;

  const notesBox = document.getElementById("focusNotes");
  if (item.notes && item.notes.trim() !== "") {
    notesBox.innerText = `"${item.notes}"`;
    notesBox.style.display = "block";
  } else {
    notesBox.style.display = "none";
  }

  const deleteBtn = document.getElementById("focus-delete-btn");
  const newDeleteBtn = deleteBtn.cloneNode(true);
  deleteBtn.parentNode.replaceChild(newDeleteBtn, deleteBtn);

  newDeleteBtn.addEventListener("click", async () => {
    const confirmed = confirm(
      `Are you sure you want to delete "${item.name}" from the collection?`,
    );
    if (!confirmed) return;

    if (!item.timestamp) {
      alert(
        "Error: This older item does not have a timestamp tracking ID and cannot be deleted via the app.",
      );
      return;
    }

    newDeleteBtn.disabled = true;
    newDeleteBtn.innerText = "Deleting... ⏳";

    try {
      await fetch(API_URL, {
        method: "POST",
        mode: "no-cors",
        cache: "no-cache",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "delete",
          timestamp: item.timestamp,
        }),
      });

      alert("Item deleted successfully!");
      document.getElementById("focusModal").style.display = "none";
      loadGalleryData();
    } catch (err) {
      console.error(err);
      alert("Could not complete deletion request.");
    } finally {
      newDeleteBtn.disabled = false;
      newDeleteBtn.innerText = "🗑️ Delete Entry";
    }
  });

  document.getElementById("focusModal").style.display = "flex";
}

function initFocusModalEvents() {
  const modal = document.getElementById("focusModal");
  const closeBtn = document.querySelector(".focus-close");

  if (closeBtn) {
    closeBtn.addEventListener("click", () => {
      modal.style.display = "none";
    });
  }

  if (modal) {
    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        modal.style.display = "none";
      }
    });
  }
}
