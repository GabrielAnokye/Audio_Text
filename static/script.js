// Store last known auth state to prevent loops
let lastAuthState = null;

// Check auth state only on home page
if (window.location.pathname === "/") {
  firebase.auth().onAuthStateChanged((user) => {
    if (!user) {
      window.location.replace("/login");
      return;
    }
  });
}

// Helper function to toggle spinner (replaces button text with spinner)
function toggleSpinner(button, show) {
  if (show) {
    // Save the original button text in a data attribute
    button.setAttribute("data-original-text", button.innerText);
    button.innerText = ""; // Clear the text
    button.disabled = true; // Disable the button

    // Create and append the spinner
    const spinner = document.createElement("span");
    spinner.classList.add("spinner");
    button.appendChild(spinner);
  } else {
    // Restore the original button text and remove spinner
    const originalText = button.getAttribute("data-original-text");
    button.innerText = originalText;
    button.disabled = false;
  }
}

// Login function
async function login(email, password) {
  try {
    const userCredential = await firebase
      .auth()
      .signInWithEmailAndPassword(email, password);
    const token = await userCredential.user.getIdToken();

    // Send token to backend
    const response = await fetch("/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ token }),
    });

    if (!response.ok) throw new Error("Login failed");

    return await response.json();
  } catch (error) {
    console.error("Login error:", error);
    throw error;
  }
}

// Signup function
async function signup(email, password) {
  try {
    const userCredential = await firebase
      .auth()
      .createUserWithEmailAndPassword(email, password);
    const token = await userCredential.user.getIdToken();

    // Send token to backend
    const response = await fetch("/signup", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ token }),
    });

    if (!response.ok) throw new Error("Signup failed");

    return await response.json();
  } catch (error) {
    console.error("Signup error:", error);
    throw error;
  }
}

// Modified fetch function to include authentication
async function fetchWithAuth(url, options = {}) {
  const token = localStorage.getItem("authToken");
  return fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${token}`,
    },
  });
}

// Function to load user's transcriptions
async function loadTranscriptions() {
  try {
    const response = await fetchWithAuth("/get-transcriptions");
    const data = await response.json();

    if (data.success) {
      displayTranscriptions(data.transcriptions);
    }
  } catch (error) {
    console.error("Error loading transcriptions:", error);
  }
}

// Update your existing fetch calls to use fetchWithAuth
// For example:
async function transcribeAudio(audioBlob) {
  const formData = new FormData();
  formData.append("file", audioBlob);

  try {
    const response = await fetchWithAuth("/transcribe", {
      method: "POST",
      body: formData,
    });

    const data = await response.json();
    if (data.success) {
      displayTranscription(data.transcription);
    }
  } catch (error) {
    console.error("Transcription error:", error);
  }
}

// Transcription Button Event Listener
document
  .getElementById("transcribe-btn")
  .addEventListener("click", async () => {
    const fileInput = document.getElementById("audio-file");
    const file = fileInput.files[0];
    if (!file) return alert("Please upload an audio file.");

    const transcribeButton = document.getElementById("transcribe-btn");
    toggleSpinner(transcribeButton, true); // Show spinner

    const formData = new FormData();
    formData.append("file", file);

    try {
      const token = localStorage.getItem("authToken");
      if (!token) {
        throw new Error("No authentication token found");
      }

      const response = await fetch("/transcribe", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "X-Requested-With": "XMLHttpRequest",
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Transcription failed");
      }

      const data = await response.json();
      if (data.success) {
        document.getElementById("transcription-text").innerText =
          data.transcription;
        // Refresh history if it's visible
        if (
          document.getElementById("history-tab").classList.contains("active")
        ) {
          loadTranscriptionHistory();
        }
      } else {
        throw new Error(data.message || "Transcription failed");
      }
    } catch (error) {
      console.error("Transcription error:", error);
      alert("Error: " + error.message);
    } finally {
      toggleSpinner(transcribeButton, false); // Hide spinner
    }
  });

// Generate Summary Button Event Listeners
document.getElementById("generate-summary").addEventListener("click", () => {
  generateSummary("normal", "generate-summary");
});

document
  .getElementById("generate-bullet-summary")
  .addEventListener("click", () => {
    generateSummary("bullet", "generate-bullet-summary");
  });

// Generate Summary Function
function generateSummary(summaryType, buttonId) {
  const text = document.getElementById("transcription-text").innerText;

  if (!text) {
    alert("Please provide text to summarize.");
    return;
  }

  const button = document.getElementById(buttonId);
  toggleSpinner(button, true); // Show spinner

  const token = localStorage.getItem("authToken");
  fetch("/summarize", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      "X-Requested-With": "XMLHttpRequest",
    },
    body: JSON.stringify({ text: text, summary_type: summaryType }),
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.success) {
        document.getElementById("summary-text").innerText = data.summary;
      } else {
        alert("Error generating summary: " + data.message);
      }
    })
    .catch((error) => {
      console.error("Error:", error);
      alert("An error occurred while generating the summary.");
    })
    .finally(() => {
      toggleSpinner(button, false); // Hide spinner
    });
}

document
  .getElementById("generate-custom-prompt")
  .addEventListener("click", () => {
    const prompt = document.getElementById("custom-prompt").value.trim();
    const transcription = document
      .getElementById("transcription-text")
      .innerText.trim();

    if (!prompt) {
      alert("Please enter a prompt.");
      return;
    }

    if (!transcription) {
      alert("Please generate a transcription first.");
      return;
    }

    const button = document.getElementById("generate-custom-prompt");
    toggleSpinner(button, true); // Show spinner

    const token = localStorage.getItem("authToken");
    fetch("/custom-prompt", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        "X-Requested-With": "XMLHttpRequest",
      },
      body: JSON.stringify({
        prompt: prompt,
        transcription: transcription,
      }),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          document.getElementById("custom-output").innerText = data.output;
        } else {
          alert("Error generating output: " + data.message);
        }
      })
      .catch((error) => {
        console.error("Error:", error);
        alert("An error occurred while processing the prompt.");
      })
      .finally(() => {
        toggleSpinner(button, false); // Hide spinner
      });
  });

document.getElementById("copy-transcription").addEventListener("click", () => {
  const text = document.getElementById("transcription-text").innerText;
  navigator.clipboard.writeText(text);
  alert("Transcription copied to clipboard!");
});

document.getElementById("copy-summary").addEventListener("click", () => {
  const text1 = document.getElementById("summary-text").innerText;
  navigator.clipboard.writeText(text1);
  alert("Summary copied to clipboard!");
});

document.getElementById("copy-chat").addEventListener("click", () => {
  const text2 = document.getElementById("custom-output").innerText;
  navigator.clipboard.writeText(text2);
  alert("Summary copied to clipboard!");
});

// Add this function to handle logout
async function handleLogout() {
  try {
    await firebase.auth().signOut();
    localStorage.removeItem("authToken");
    window.location.replace("/logout");
  } catch (error) {
    console.error("Logout error:", error);
    alert("Logout failed: " + error.message);
  }
}

function showTab(tabName) {
  // Hide all tabs
  document.querySelectorAll(".tab-content").forEach((tab) => {
    tab.classList.remove("active");
  });
  document.querySelectorAll(".tab-btn").forEach((btn) => {
    btn.classList.remove("active");
  });

  // Show selected tab
  document.getElementById(`${tabName}-tab`).classList.add("active");
  document
    .querySelector(`[onclick="showTab('${tabName}')"]`)
    .classList.add("active");

  // Load history if history tab is selected
  if (tabName === "history") {
    loadTranscriptionHistory();
  }
}

async function loadTranscriptionHistory() {
  const historyList = document.getElementById("history-list");
  historyList.innerHTML = '<div class="spinner"></div>';

  try {
    const token = localStorage.getItem("authToken");
    if (!token) throw new Error("No authentication token found");

    const response = await fetch("/get-transcriptions", {
      headers: {
        Authorization: `Bearer ${token}`,
        "X-Requested-With": "XMLHttpRequest",
      },
    });

    if (!response.ok) throw new Error("Failed to load history");

    const data = await response.json();
    if (!data.success)
      throw new Error(data.message || "Failed to load history");

    historyList.innerHTML = data.transcriptions.length
      ? data.transcriptions
          .map(
            (item, index) => `
        <div class="history-item">
          <div class="timestamp">${new Date(
            item.timestamp
          ).toLocaleString()}</div>
          <div class="filename">${item.filename}</div>
          <div class="transcription">${item.transcription}</div>
          <div class="actions">
            <button class="use-btn" data-index="${index}">Use This</button>
            <button class="copy-btn" data-index="${index}">Copy</button>
          </div>
        </div>
      `
          )
          .join("")
      : "<p>No transcription history found</p>";

    // Store transcriptions in a variable accessible to the event listeners
    window.transcriptionHistory = data.transcriptions;

    // Add event listeners after creating the elements
    document.querySelectorAll(".use-btn").forEach((button) => {
      button.addEventListener("click", function () {
        const index = this.getAttribute("data-index");
        useHistoryItem(window.transcriptionHistory[index].transcription);
      });
    });

    document.querySelectorAll(".copy-btn").forEach((button) => {
      button.addEventListener("click", function () {
        const index = this.getAttribute("data-index");
        copyHistoryItem(window.transcriptionHistory[index].transcription);
      });
    });
  } catch (error) {
    console.error("History error:", error);
    historyList.innerHTML = `<p class="error">Error loading history: ${error.message}</p>`;
  }
}

function useHistoryItem(transcription) {
  document.getElementById("transcription-text").innerText = transcription;
  showTab("main");
}

function copyHistoryItem(transcription) {
  navigator.clipboard
    .writeText(transcription)
    .then(() => {
      alert("Transcription copied to clipboard!");
    })
    .catch((err) => {
      console.error("Failed to copy text: ", err);
      alert("Failed to copy to clipboard");
    });
}
