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
      const response = await fetch("http://127.0.0.1:5000/transcribe", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Server error: " + response.statusText);
      }

      const data = await response.json();
      if (data.success) {
        document.getElementById("transcription-text").innerText =
          data.transcription;
      } else {
        alert("Transcription failed: " + data.message);
      }
    } catch (error) {
      console.error(error);
      alert("An error occurred while transcribing.");
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

  fetch("/summarize", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
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

    fetch("/custom-prompt", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
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
