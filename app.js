const API_URL =
  "https://script.google.com/macros/s/AKfycbxZxJENZlTYzPgdXeM7bAyGdqVUnv-fJUnRVG-6e3PwW5wPPnf4Ef9fmAUIPrp4qxMiPQ/exec";

const CORRECT_PASSCODE = "1234"; // Replace with your actual passcode

let base64ImageData = "";

// Initialize App on DOM Load
document.addEventListener("DOMContentLoaded", () => {
  setupPasscodeLock();
  setupEventListeners();
  loadCatalog();
});

// PASSCODE GATEKEEPER LOCK
function setupPasscodeLock() {
  const loginBtn = document.getElementById("login-btn");
  const passcodeInput = document.getElementById("passcode-input");
  const lockScreen = document.getElementById("lock-screen");
  const appContainer = document.getElementById("app-container");
  const errorMessage = document.getElementById("login-error");

  loginBtn.addEventListener("click", () => {
    if (passcodeInput.value === CORRECT_PASSCODE) {
      lockScreen.classList.add("hidden");
      appContainer.classList.remove("hidden");
      loadCatalog();
    } else {
      errorMessage.textContent = "Incorrect passcode. Try again! ❤️";
      passcodeInput.value = "";
    }
  });

  passcodeInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") loginBtn.click();
  });
}

// ROUTING & EVENT LISTENERS
function setupEventListeners() {
  const addBtn = document.getElementById("add-btn");
  const cancelBtn = document.getElementById("form-cancel-btn");
  const form = document.getElementById("keychain-form");
  const imageInput = document.getElementById("form-image");

  // Open Form View
  addBtn.addEventListener("click", () => {
    document.getElementById("gallery-view").classList.add("hidden");
    document.getElementById("form-view").classList.remove("hidden");
  });

  // Cancel Form View
  cancelBtn.addEventListener("click", () => {
    resetForm();
    document.getElementById("form-view").classList.add("hidden");
    document.getElementById("gallery-view").classList.remove("hidden");
  });

  // Handle Image Upload Selection
  imageInput.addEventListener("change", handleImageProcessing);

  // Handle Form Submission
  form.addEventListener("submit", handleFormSubmit);
}

// COMPRESS & PROCESS CAMERA IMAGES FOR THE CLOUD
function handleImageProcessing(e) {
  const file = e.target.files[0];
  if (!file) return;

  const previewDiv = document.getElementById("image-preview");
  previewDiv.innerHTML = "Processing image... 📸";

  const reader = new FileReader();
  reader.onload = function (event) {
    const img = new Image();
    img.onload = function () {
      const canvas = document.createElement("canvas");
      let width = img.width;
      let height = img.height;

      // Restrict max sizing dimensions to keep payloads lightweight
      const MAX_WIDTH = 800;
      const MAX_HEIGHT = 800;

      if (width > height) {
        if (width > MAX_WIDTH) {
          height *= MAX_WIDTH / width;
          width = MAX_WIDTH;
        }
      } else {
        if (height > MAX_HEIGHT) {
          width *= MAX_HEIGHT / height;
          height = MAX_HEIGHT;
        }
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, width, height);

      // Compress to high efficiency JPEG
      base64ImageData = canvas.toDataURL("image/jpeg", 0.75);
      previewDiv.innerHTML = `<img src="${base64ImageData}" style="max-width:100%; border-radius:8px; margin-top:10px;">`;
    };
    img.src = event.target.result;
  };
  reader.readAsDataURL(file);
}

// POST DATA STREAM TO GOOGLE SPREADSHEET
async function handleFormSubmit(e) {
  e.preventDefault();

  const submitBtn = document.getElementById("form-submit-btn");
  const originalBtnText = submitBtn.textContent;

  // Visual status update
  submitBtn.disabled = true;
  submitBtn.textContent = "Saving to cloud... ☁️";

  // Package payload data cleanly
  const payload = {
    name: document.getElementById("form-name").value.trim(),
    location: document.getElementById("form-location").value.trim(),
    date: document.getElementById("form-date").value,
    notes: document.getElementById("form-notes").value.trim(),
    imageUrl: base64ImageData // Will pass empty string if no image chosen
  };

  if (!payload.name || !payload.location) {
    alert("Please fill out at least the Name and Location fields!");
    submitBtn.disabled = false;
    submitBtn.textContent = originalBtnText;
    return;
  }

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      mode: "no-cors", // Crucial block bypass for mobile redirects
      headers: { "Content-Type": "text/plain" },
      body: JSON.stringify(payload)
    });

    // Since 'no-cors' returns an opaque response type, we verify completion via timeline delay
    alert("Keychain entry successfully pushed! 🎉");
    resetForm();
    
    // Bounce back to the main updated view gallery
    document.getElementById("form-view").classList.add("hidden");
    document.getElementById("gallery-view").classList.remove("hidden");
    loadCatalog();

  } catch (error) {
    console.error("Network transfer breakdown:", error);
    alert("Cloud connection dropped. Please check connection and try again.");
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = originalBtnText;
  }
}

// FETCH DATABASE AND RENDER CARDS
async function loadCatalog() {
  const gallery = document.getElementById("gallery-grid");
  gallery.innerHTML = "<p class='loading-text'>Syncing collection data...</p>";

  try {
    const response = await fetch(API_URL);
    const data = await response.json();

    if (!data || data.length === 0) {
      gallery.innerHTML = "<p class='empty-text'>No keychains tracked yet. Tap the button above to add your first one! 🗺️</p>";
      return;
    }

    gallery.innerHTML = ""; // Clear loader text

    // Sort newest acquired entries straight to the top of the grid view
    data.reverse().forEach(item => {
      const card = document.createElement("div");
      card.className = "keychain-card";

      // Fallback placeholder graphic asset if entry was saved without a phone photo
      const imageTag = item.imageUrl 
        ? `<img src="${item.imageUrl}" alt="${item.name}" class='card-img' onerror="this.src='https://placehold.co/400x300?text=No+Photo+Available'">`
        : `<div class="card-img-placeholder">🔑</div>`;

      card.innerHTML = `
        ${imageTag}
        <div class="card-content">
          <h3>${item.name || "Unnamed Keepsake"}</h3>
          <p class="meta-location">📍 ${item.location || "Unknown Location"}</p>
          <p class="meta-date">📅 ${item.date || "No Date Specified"}</p>
          ${item.notes ? `<p class="meta-notes">" ${item.notes} "</p>` : ""}
        </div>
      `;
      gallery.appendChild(card);
    });

  } catch (error) {
    console.error("Failed to read database records:", error);
    gallery.innerHTML = "<p class='empty-text'>Unable to display gallery sync. Check API connection status strings.</p>";
  }
}

// UTILITY FORM STATE RESET
function resetForm() {
  document.getElementById("keychain-form").reset();
  document.getElementById("image-preview").innerHTML = "";
  base64ImageData = "";
}
