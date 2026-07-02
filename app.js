// ========================================================
// REPO CONFIGURATION & CLOUD APIS
// ========================================================
const API_URL =
  "https://script.google.com/macros/s/AKfycbxPoyWNVcpBaFSJmTm1BoZTd01EfouS13emZPQ2lJvCK5MyW8zMlgQ-0LyYCWU85KFjOw/exec";

const CORRECT_PASSCODE = "4177"; // e.g., "1234"
const CLOUDINARY_CLOUD_NAME = "xzpkydjm";
const CLOUDINARY_PRESET = "keychain_preset"; // The preset name you created

let localImageFileBlob = null;

// Initialization Hook
document.addEventListener("DOMContentLoaded", () => {
  initAppSecurity();
  initNavigationAndForm();
  initFocusModalEvents();
  initPasscodeManagementEvents(); // Integrated control system
});

// Helper to check what the current active passcode is
function getActivePasscode() {
  return localStorage.getItem("custom_app_passcode") || CORRECT_PASSCODE;
}

// ========================================================
// SECURITY LAYER WITH PERSISTENT MEMORY
// ========================================================
function initAppSecurity() {
  const lockScreen = document.getElementById("lock-screen");
  const mainApp = document.getElementById("main-app");
  const passcodeInput = document.getElementById("passcode-input");
  const loginBtn = document.getElementById("login-btn");
  const errorMsg = document.getElementById("error-message");
  const logoutBtn = document.getElementById("logout-btn");

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

  // LOGOUT LOGIC: Clears session token and snaps back to lock screen immediately
  logoutBtn.addEventListener("click", () => {
    localStorage.removeItem("app_unlocked");
    mainApp.classList.add("hidden");
    lockScreen.classList.remove("hidden");
  });
}

function checkPasscode(input, lockView, appView, errorView) {
  if (input.value === getActivePasscode()) {
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

  navAddBtn.addEventListener("click", () => {
    galleryView.classList.add("hidden");
    formView.classList.remove("hidden");
    document.getElementById("input-date").valueAsDate = new Date();
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
    const location = document.getElementById("input-location").value.trim();
    const date = document.getElementById("input-date").value;
    const notes = document.getElementById("input-notes").value.trim();

    if (!name || !location || !date) {
      alert("Please fill out Name, Location, and Date fields before saving.");
      return;
    }

    if (!localImageFileBlob) {
      alert("Please take or select a photo of the keychain first!");
      return;
    }

    formSubmitBtn.disabled = true;
    formSubmitBtn.innerText = "Uploading Photo... 📸";

    try {
      const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;
      const formData = new FormData();
      formData.append("file", localImageFileBlob);
      formData.append("upload_preset", CLOUDINARY_PRESET);

      const cloudResponse = await fetch(cloudinaryUrl, {
        method: "POST",
        body: formData,
      });

      if (!cloudResponse.ok) throw new Error("Cloudinary media upload failed");
      const cloudData = await cloudResponse.json();
      const secureCDNImageUrl = cloudData.secure_url;

      formSubmitBtn.innerText = "Saving to catalog... ☁️";

      const payload = {
        name: name,
        location: location,
        date: date,
        imageUrl: secureCDNImageUrl,
        notes: notes,
      };

      await fetch(API_URL, {
        method: "POST",
        mode: "no-cors",
        cache: "no-cache",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      alert("Success! Keychain saved into our travel catalog.");
      keychainForm.reset();
      imagePreview.innerHTML = "";
      localImageFileBlob = null;
      formView.classList.add("hidden");
      galleryView.classList.remove("hidden");
      loadGalleryData();
    } catch (err) {
      console.error(err);
      alert("Process stopped. Image hosting pipeline or sheet storage failed.");
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
        grid.innerHTML = `<div class="empty-text">No keychains saved yet. Tap ＋ to start!</div>`;
        return;
      }

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
  document.getElementById("focusLocation").innerText = item.location
    ? `📍 ${item.location}`
    : "📍 Unknown";
  document.getElementById("focusDate").innerText = item.date
    ? `📅 ${item.date}`
    : "";

  const notesBox = document.getElementById("focusNotes");
  if (item.notes && item.notes.trim() !== "") {
    notesBox.innerText = `"${item.notes}"`;
    notesBox.style.display = "block";
  } else {
    notesBox.style.display = "none";
  }

  // --- NEW DELETE LOGIC FOR MODAL ---
  const deleteBtn = document.getElementById("focus-delete-btn");

  // Wipe out any older event listeners so clicking doesn't trigger multiple times
  const newDeleteBtn = deleteBtn.cloneNode(true);
  deleteBtn.parentNode.replaceChild(newDeleteBtn, deleteBtn);

  newDeleteBtn.addEventListener("click", async () => {
    // Safety prompt check
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
      const response = await fetch(API_URL, {
        method: "POST",
        mode: "no-cors", // Bypasses browser CORS policy blocks
        cache: "no-cache",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "delete",
          timestamp: item.timestamp,
        }),
      });

      alert("Item deleted successfully!");
      document.getElementById("focusModal").style.display = "none"; // Close view
      loadGalleryData(); // Refresh the main dashboard view automatically!
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

// ========================================================
// PASSCODE MANAGEMENT MODULE
// ========================================================
function initPasscodeManagementEvents() {
  const modal = document.getElementById("passcodeModal");
  const changeBtn = document.getElementById("nav-change-passcode-btn");
  const cancelBtn = document.getElementById("cancel-passcode-btn");
  const saveBtn = document.getElementById("save-passcode-btn");

  const oldInput = document.getElementById("old-passcode-input");
  const newInput = document.getElementById("new-passcode-input");

  changeBtn.addEventListener("click", () => {
    oldInput.value = "";
    newInput.value = "";
    modal.style.display = "flex";
  });

  cancelBtn.addEventListener("click", () => {
    modal.style.display = "none";
  });

  saveBtn.addEventListener("click", () => {
    const activePasscode = getActivePasscode();

    if (oldInput.value !== activePasscode) {
      alert("Current passcode is incorrect. Please try again.");
      oldInput.value = "";
      return;
    }

    if (newInput.value.trim() === "") {
      alert("New passcode cannot be blank.");
      return;
    }

    // Save new code permanently to the phone browser's storage
    localStorage.setItem("custom_app_passcode", newInput.value.trim());
    alert("Passcode updated successfully!");
    modal.style.display = "none";
  });
}
