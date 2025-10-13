// API Key and Endpoint Setup
const endpoint = '/api/generate';

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
const micBtn = document.getElementById('micBtn');

// Speech Recognition Setup
let recognition = null;
let isListening = false;

// Initialize speech recognition if available
function initSpeechRecognition() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  
  if (SpeechRecognition) {
    recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';
    
    // Handle results
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      inputText.value = transcript;
    };
    
    // Handle end of speech recognition
    recognition.onend = () => {
      isListening = false;
      micBtn.querySelector('img').classList.remove('mic-active');
    };
    
    // Handle errors
    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      isListening = false;
      micBtn.querySelector('img').classList.remove('mic-active');
      
      if (event.error === 'not-allowed') {
        alert('Please enable microphone access to use speech input.');
      }
    };
  } else {
    micBtn.style.display = 'none';
    console.log('Speech recognition not supported by this browser.');
  }
}

// Toggle speech recognition
function toggleSpeechRecognition() {
  if (!recognition) {
    alert('Speech recognition is not supported by your browser.');
    return;
  }
  
  if (isListening) {
    recognition.stop();
    isListening = false;
    micBtn.querySelector('img').classList.remove('mic-active');
  } else {
    // Clear input field before new speech input
    inputText.value = '';
    recognition.start();
    isListening = true;
    micBtn.querySelector('img').classList.add('mic-active');
  }
}

// Initialize speech recognition
initSpeechRecognition();

// Mic button event listener
micBtn.addEventListener('click', toggleSpeechRecognition);

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
  // Stop speech recognition if active
  if (isListening && recognition) {
    recognition.stop();
    isListening = false;
    micBtn.querySelector('img').classList.remove('mic-active');
  }

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
  body: JSON.stringify({ userInput })
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






