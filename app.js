// ========================================================
// REPO STATE & MEMORY MODULES
// ========================================================
let localImageFileBlob = null;
let activeDateMode = "today";

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
    if (lockScreen) lockScreen.classList.add("hidden");
    if (mainApp) mainApp.classList.remove("hidden");
    loadGalleryData();
  }

  if (loginBtn) {
    loginBtn.addEventListener("click", () => {
      checkPasscode(passcodeInput, lockScreen, mainApp, errorMsg);
    });
  }

  if (passcodeInput) {
    passcodeInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        checkPasscode(passcodeInput, lockScreen, mainApp, errorMsg);
      }
    });
  }

  const logoutBtn = document.getElementById("logout-btn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      localStorage.removeItem("app_unlocked");
      const profileMenu = document.getElementById("profile-menu-content");
      if (profileMenu) profileMenu.classList.add("hidden");
      if (mainApp) mainApp.classList.add("hidden");
      if (lockScreen) lockScreen.classList.remove("hidden");
    });
  }
}

function checkPasscode(input, lockView, appView, errorView) {
  if (!input) return;
  if (input.value === CORRECT_PASSCODE) {
    localStorage.setItem("app_unlocked", "true");
    if (errorView) errorView.classList.add("hidden");
    if (lockView) lockView.classList.add("hidden");
    if (appView) appView.classList.remove("hidden");
    input.value = "";
    loadGalleryData();
  } else {
    if (errorView) errorView.classList.remove("hidden");
    input.value = "";
    input.classList.add("error-shake");
    setTimeout(() => {
      input.classList.remove("error-shake");
    }, 500);
  }
}

// ========================================================
// PROFILE MENU DROPDOWN INTERACTION
// ========================================================
function initProfileDropdown() {
  const trigger = document.getElementById("profile-menu-btn");
  const content = document.getElementById("profile-menu-content");

  if (!trigger || !content) return;

  trigger.addEventListener("click", (e) => {
    e.stopPropagation();
    content.classList.toggle("hidden");
  });

  document.addEventListener("click", () => {
    content.classList.add("hidden");
  });
}

// ========================================================
// DATE SELECTION TOGGLE CONTROLLER
// ========================================================
function initDateToggleControl() {
  const btnToday = document.getElementById("date-mode-today");
  const btnCustom = document.getElementById("date-mode-custom");
  const btnUnknown = document.getElementById("date-mode-unknown");
  const customContainer = document.getElementById("custom-date-container");
  const dateInput = document.getElementById("input-date");

  if (!btnToday || !btnCustom || !btnUnknown) return;

  function setMode(mode) {
    activeDateMode = mode;
    btnToday.classList.remove("active");
    btnCustom.classList.remove("active");
    btnUnknown.classList.remove("active");

    // Enforce base state reset cleanly via utility classes
    if (customContainer) {
      customContainer.classList.add("hidden");
    }

    if (mode === "today") {
      btnToday.classList.add("active");
      if (dateInput) {
        const today = new Date();
        dateInput.value = today.toISOString().split("T")[0];
      }
    } else if (mode === "custom") {
      btnCustom.classList.add("active");
      if (customContainer) {
        customContainer.classList.remove("hidden");
      }
      if (dateInput && !dateInput.value) {
        const today = new Date();
        dateInput.value = today.toISOString().split("T")[0];
      }
    } else if (mode === "unknown") {
      btnUnknown.classList.add("active");
      if (dateInput) dateInput.value = "";
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
  const addButton = document.getElementById("add-btn");
  const formCancelBtn = document.getElementById("form-cancel-btn");
  const formSubmitBtn = document.getElementById("form-submit-btn");
  const fileInput = document.getElementById("input-file");
  const imagePreview = document.getElementById("image-preview");
  const keychainForm = document.getElementById("keychain-form");

  if (addButton) {
    addButton.addEventListener("click", () => {
      if (galleryView) galleryView.classList.add("hidden");
      if (formView) formView.classList.remove("hidden");

      if (formSubmitBtn) {
        formSubmitBtn.disabled = false;
        formSubmitBtn.innerText = "Save to Catalog";
      }

      addButton.classList.add("hidden");

      const todayBtn = document.getElementById("date-mode-today");
      if (todayBtn) todayBtn.click();
    });
  }

  if (formCancelBtn) {
    formCancelBtn.addEventListener("click", () => {
      if (keychainForm) keychainForm.reset();
      if (imagePreview) imagePreview.innerHTML = "";
      localImageFileBlob = null;
      if (formView) formView.classList.add("hidden");
      if (galleryView) galleryView.classList.remove("hidden");

      if (addButton) addButton.classList.remove("hidden");

      if (formSubmitBtn) {
        formSubmitBtn.disabled = false;
        formSubmitBtn.innerText = "Save to Catalog";
      }
    });
  }

  if (fileInput) {
    fileInput.addEventListener("change", (event) => {
      const file = event.target.files[0];
      if (!file) return;

      localImageFileBlob = file;
      const reader = new FileReader();
      reader.onload = (e) => {
        if (imagePreview) {
          imagePreview.innerHTML = `<img src="${e.target.result}" alt="Preview">`;
        }
      };
      reader.readAsDataURL(file);
    });
  }

  if (formSubmitBtn) {
    formSubmitBtn.addEventListener("click", async () => {
      const nameInput = document.getElementById("input-name");
      const locationInput = document.getElementById("input-location");
      const notesInput = document.getElementById("input-notes");

      const name = nameInput ? nameInput.value.trim() : "";
      const location =
        (locationInput && locationInput.value.trim()) || "Unknown";
      const notes = (notesInput && notesInput.value.trim()) || "";

      if (!name) {
        alert("Please provide a name for this keychain entry.");
        return;
      }

      let dateFinalString = "Unknown";
      if (activeDateMode === "today") {
        const today = new Date();
        dateFinalString = today.toISOString().split("T")[0];
      } else if (activeDateMode === "custom") {
        const dateInputElem = document.getElementById("input-date");
        const selectedCustomDate = dateInputElem ? dateInputElem.value : "";
        if (!selectedCustomDate) {
          alert("Please choose your customized calendar date.");
          return;
        }
        dateFinalString = selectedCustomDate;
      } else if (activeDateMode === "unknown") {
        dateFinalString = "Unknown";
      }

      if (!localImageFileBlob) {
        alert("Please take or select a photo of the keychain first!");
        return;
      }

      formSubmitBtn.disabled = true;
      formSubmitBtn.innerText = "Uploading Photo... 📸";

      try {
        let secureCDNImageUrl = "";

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

        formSubmitBtn.innerText = "Saving to catalog... ☁️";

        const payload = {
          name: name,
          location: location,
          date: dateFinalString,
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
        if (keychainForm) keychainForm.reset();
        if (imagePreview) imagePreview.innerHTML = "";
        localImageFileBlob = null;
        if (formView) formView.classList.add("hidden");
        if (galleryView) galleryView.classList.remove("hidden");

        if (addButton) addButton.classList.remove("hidden");
        loadGalleryData();
      } catch (err) {
        console.error(err);
        alert(
          "Process stopped. Image hosting pipeline or sheet storage failed.",
        );
      } finally {
        formSubmitBtn.disabled = false;
        formSubmitBtn.innerText = "Save to Catalog";
      }
    });
  }
}

// ========================================================
// DATABASE FETCH & FEED RENDER ROUTINE
// ========================================================
function loadGalleryData() {
  const grid = document.getElementById("gallery-grid");
  const loadingContainer = document.getElementById("loading-text");
  if (!grid) return;

  fetch(API_URL)
    .then((res) => res.json())
    .then((data) => {
      if (loadingContainer) {
        loadingContainer.classList.add("hidden");
      }

      grid.innerHTML = "";

      if (!data || data.length === 0) {
        grid.innerHTML = `<div class="empty-text">No keychains saved yet. Tap the floating button to start!</div>`;
        return;
      }

      data.reverse().forEach((item) => {
        const card = document.createElement("div");
        card.className = "keychain-card";

        const imageSegment = item.imageurl
          ? `<img src="${item.imageurl}" class="card-img" alt="Keychain image" loading="lazy">`
          : `<div class="card-img-placeholder">🔑</div>`;

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
      if (loadingContainer) {
        loadingContainer.classList.add("hidden");
      }
      grid.innerHTML = `<div class="empty-text">Error loading database. Please try reloading.</div>`;
    });
}

// ========================================================
// DETAIL CARD MODAL FOCUS VIEW CONTROLLER
// ========================================================
function openFocusMode(item) {
  const imgElem = document.getElementById("focusImage");
  const nameElem = document.getElementById("focusName");
  const locElem = document.getElementById("focusLocation");
  const dateElem = document.getElementById("focusDate");
  const notesBox = document.getElementById("focusNotes");

  if (imgElem) imgElem.src = item.imageurl || "";
  if (nameElem) nameElem.innerText = item.name || "Unnamed Keychain";
  if (locElem) locElem.innerText = `From: ${item.location || "Unknown"}`;

  let formattedDate = "Unknown";
  if (item.date && item.date.toLowerCase() !== "unknown") {
    try {
      const parts = item.date.split("-");
      if (parts.length === 3) {
        const dateObj = new Date(parts[0], parts[1] - 1, parts[2]);
        formattedDate = dateObj.toLocaleDateString("en-US", {
          month: "long",
          day: "numeric",
          year: "numeric",
        });
      } else {
        const dateObj = new Date(item.date);
        if (!isNaN(dateObj.getTime())) {
          formattedDate = dateObj.toLocaleDateString("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric",
          });
        }
      }
    } catch (e) {
      console.error("Date parsing error: ", e);
      formattedDate = item.date;
    }
  }
  if (dateElem) dateElem.innerText = `📅 ${formattedDate}`;

  if (notesBox) {
    if (item.notes && item.notes.trim() !== "") {
      notesBox.innerText = `"${item.notes}"`;
      notesBox.style.display = "block";
    } else {
      notesBox.style.display = "none";
    }
  }

  const deleteBtn = document.getElementById("focus-delete-btn");
  if (deleteBtn) {
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
        const modal = document.getElementById("focusModal");
        if (modal) modal.style.display = "none";
        loadGalleryData();
      } catch (err) {
        console.error(err);
        alert("Could not complete deletion request.");
      } finally {
        newDeleteBtn.disabled = false;
        newDeleteBtn.innerText = "🗑️ Delete Entry";
      }
    });
  }

  const modal = document.getElementById("focusModal");
  if (modal) modal.style.display = "flex";
}

function initFocusModalEvents() {
  const modal = document.getElementById("focusModal");
  const closeBtn = document.querySelector(".focus-close");

  if (closeBtn) {
    closeBtn.addEventListener("click", () => {
      if (modal) modal.style.display = "none";
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
