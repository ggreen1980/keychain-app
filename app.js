const API_URL = "YOUR_APPS_SCRIPT_WEB_APP_URL";
const APP_PASSCODE = "1234"; // Set her private 4-digit passcode here!

let base64ImageData = "";

// Element Selectors
const lockScreen = document.getElementById("lock-screen");
const mainApp = document.getElementById("main-app");
const galleryView = document.getElementById("gallery-view");
const addView = document.getElementById("add-view");

// Event Wireframes
document.getElementById("unlock-btn").addEventListener("click", handleUnlock);
document
  .getElementById("nav-add-btn")
  .addEventListener("click", () => showView("add"));
document
  .getElementById("form-cancel-btn")
  .addEventListener("click", () => showView("gallery"));
document
  .getElementById("keychain-form")
  .addEventListener("submit", handleFormSubmit);
document
  .getElementById("form-image")
  .addEventListener("change", handleImageProcessing);

function handleUnlock() {
  const input = document.getElementById("passcode-input").value;
  if (input === APP_PASSCODE) {
    lockScreen.classList.add("hidden");
    mainApp.classList.remove("hidden");
    showView("gallery");
  } else {
    document.getElementById("lock-error").innerText =
      "Incorrect code. Try again! 💕";
  }
}

function showView(viewName) {
  if (viewName === "gallery") {
    galleryView.classList.remove("hidden");
    addView.classList.add("hidden");
    fetchCollection();
  } else if (viewName === "add") {
    galleryView.classList.add("hidden");
    addView.classList.remove("hidden");
  }
}

// Resizes image slightly down for quick transit, then flags base64
function handleImageProcessing(e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (event) {
    const img = new Image();
    img.onload = function () {
      // Compress image to a reasonable size for clean mobile uploads
      const canvas = document.createElement("canvas");
      const MAX_WIDTH = 800;
      const scaleSize = MAX_WIDTH / img.width;
      canvas.width = MAX_WIDTH;
      canvas.height = img.height * scaleSize;

      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      base64ImageData = canvas.toDataURL("image/jpeg", 0.8);
      document.getElementById("image-preview").innerHTML =
        `<img src="${base64ImageData}">`;
    };
    img.src = event.target.result;
  };
  reader.readAsDataURL(file);
}

async function fetchCollection() {
  try {
    const response = await fetch(API_URL);
    const data = await response.json();
    renderGallery(data);
  } catch (error) {
    console.error("Error loading gallery:", error);
  }
}

function renderGallery(items) {
  const grid = document.getElementById("keychain-grid");
  const spinner = document.getElementById("loading-spinner");
  grid.innerHTML = "";

  if (spinner) spinner.style.display = "none";

  if (!items || items.length === 0) {
    grid.innerHTML = `<p style="grid-column: 1/-1; text-align:center; padding: 40px; color: #8c7e7e;">No keychains cataloged yet! Tap + to add your first one. ✨</p>`;
    return;
  }

  items.forEach((item) => {
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
            <img src="${item.imageUrl || "https://via.placeholder.com/150"}" alt="Keychain Photo">
            <div class="card-info">
                <h3>${item.name}</h3>
                <p>📍 ${item.location}</p>
                <p style="font-size:10px; color:#b0a2a4; margin-top:4px;">${item.date}</p>
            </div>
        `;
    grid.appendChild(card);
  });
}

async function handleFormSubmit(e) {
  e.preventDefault();

  const nameField = document.getElementById("form-name").value.trim();
  const locationField = document.getElementById("form-location").value.trim();
  const dateField = document.getElementById("form-date").value;
  const notesField = document.getElementById("form-notes").value.trim();

  // Custom JavaScript Verification
  if (!nameField || !locationField) {
    alert("Please fill out both the Name and Location! 💕");
    return;
  }

  if (!base64ImageData) {
    alert("Please snap or select a photo of the keychain first! 📸");
    return;
  }

  const submitBtn = document.getElementById("form-submit-btn");
  submitBtn.innerText = "Saving to cloud...";
  submitBtn.disabled = true;

  const payload = {
    name: nameField,
    location: locationField,
    date: dateField,
    notes: notesField,
    imageUrl: base64ImageData,
  };

  try {
    await fetch(API_URL, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    document.getElementById("keychain-form").reset();
    document.getElementById("image-preview").innerHTML = "";
    base64ImageData = "";

    showView("gallery");
  } catch (err) {
    alert("Upload failed. Make sure you are connected to internet!");
    submitBtn.innerText = "Save to Catalog";
    submitBtn.disabled = false;
  }
}
