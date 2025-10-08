// API Key and Endpoint Setup
const GEMINI_API_KEY = "AIzaSyBHzvV2ON2U1Cn6c9a0-NjMg-M8sl8foyc"; // Enter your API key here
const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

// DOM Element References
const generateBtn = document.getElementById('generateBtn');
const inputText = document.getElementById('inputText');
const outputContent = document.getElementById('outputContent');
const loader = document.getElementById('loader');
const copyBtn = document.getElementById('copyBtn');
const downloadBtn = document.getElementById('downloadBtn');
const infoBtn = document.getElementById('infoBtn');
const infoModal = document.getElementById('infoModal');
const closeModal = document.querySelector('.close');

// Show loader
function showLoader() {
  loader.style.display = 'flex';  // Set loader to be visible and centered
}

// Hide loader
function hideLoader() {
  loader.style.display = 'none';  // Hide the loader once the response is received
}

// Handle the click to generate advice
generateBtn.addEventListener('click', async () => {
  const userInput = inputText.value.trim();

  // Check if input is empty
  if (userInput === '') {
    alert('Please enter your pregnancy stage!');
    return;
  }

  showLoader();  // Show loader when the process starts
  outputContent.innerHTML = '';

  try {
    // Fetch advice from the API
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [
          { parts: [{ text: `You are an AI maternal health assistant. A woman says she is in the following stage: ${userInput}. Provide brief, safe, and supportive advice relevant to her stage.` }] }
        ]
      })
    });

    const data = await response.json();

    // Check if advice is available
    if (data.candidates && data.candidates.length > 0) {
      const rawText = data.candidates[0].content.parts[0].text;

      // Formatting logic
      function formatAdvice(text) {
        const lines = text.split('\n');
        let formattedHTML = '';
        let currentSection = '';
        let insideSection = false;

        lines.forEach((line, index) => {
          line = line.trim();

          // Check for new section heading
          if (line.endsWith(':') && !line.startsWith('*')) {
            if (insideSection) {
              currentSection += '</div>';
              formattedHTML += currentSection;
            }
            const heading = line.replace(/:$/, '').replace(/\*/g, '');
            formattedHTML += `<h2 class="advice-heading"><strong>${heading}</strong>:</h2>`;
            currentSection = '<div class="advice-section">';
            insideSection = true;
          } 
          // Handle bullet list items
          else if (line.startsWith('*') && !line.startsWith('**')) {
            let listItem = line.replace(/^\*\s*/, '').replace(/\*\*/g, '');
            if (listItem.endsWith(':')) {
              const textBeforeColon = listItem.replace(/:$/, '').trim();
              listItem = `<strong>${textBeforeColon}</strong>:` + listItem.slice(textBeforeColon.length);
            }
            currentSection += `<div class="advice-card">${listItem}</div>`;
          } 
          // Handle subheading
          else if (line.startsWith('**') && line.endsWith('**')) {
            const subheading = line.replace(/\*\*/g, '');
            currentSection += `<div class="advice-subheading"><strong>${subheading}</strong></div>`;
          } 
          // Default text formatting
          else if (line !== '') {
            const cleanLine = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
            currentSection += `<div class="advice-card">${cleanLine}</div>`;
          }

          // Append section if it's the last line
          if (index === lines.length - 1 && insideSection) {
            currentSection += '</div>';
            formattedHTML += currentSection;
          }
        });

        return formattedHTML;
      }

      // Display formatted advice
      outputContent.innerHTML = `<div id="adviceContainer">${formatAdvice(rawText)}</div>`;

    } else {
      outputContent.innerHTML = "Sorry, I couldn't find any advice.";
    }
  } catch (error) {
    console.error('Error:', error);
    outputContent.innerHTML = "There was an error getting the advice. Please try again later.";
  } finally {
    hideLoader();  // Hide loader when the response is processed
  }
});

// Copy text button functionality
copyBtn.addEventListener('click', () => {
  const text = outputContent.innerText;
  navigator.clipboard.writeText(text)
    .then(() => alert('Advice copied!'))
    .catch(err => console.error('Failed to copy: ', err));
});

// Download text button functionality
downloadBtn.addEventListener('click', () => {
  const text = outputContent.innerText;
  const blob = new Blob([text], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'maternal_health_advice.txt';
  a.click();
  URL.revokeObjectURL(url);
});

// Info modal handling
infoBtn.addEventListener('click', () => {
  infoModal.style.display = 'block';
});

closeModal.addEventListener('click', () => {
  infoModal.style.display = 'none';
});

window.addEventListener('click', (event) => {
  if (event.target === infoModal) {
    infoModal.style.display = 'none';
  }
});


