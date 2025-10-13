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
    
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      inputText.value = transcript;
    };
    
    recognition.onend = () => {
      isListening = false;
      micBtn.querySelector('img').classList.remove('mic-active');
    };
    
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
  loader.style.display = 'flex';
}

// Hide loader
function hideLoader() {
  loader.style.display = 'none';
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

  console.log('Generating advice for:', userInput);
  showLoader();
  outputContent.innerHTML = '';

  try {
    console.log('Sending request to:', endpoint);
    
    // Fetch advice from the API
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ userInput })
    });

    console.log('Response status:', response.status);
    console.log('Response ok:', response.ok);

    // Get response text first to see what we're getting
    const responseText = await response.text();
    console.log('Response text:', responseText);

    // Try to parse as JSON
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      console.error('Response was not valid JSON:', responseText);
      throw new Error('Invalid response from server');
    }

    console.log('Parsed data:', data);

    // Check for errors in response
    if (!response.ok) {
      console.error('API error:', data);
      throw new Error(data.error || `Server error: ${response.status}`);
    }

    // Check if advice is available
    if (data.candidates && data.candidates.length > 0) {
      const rawText = data.candidates[0].content.parts[0].text;
      console.log('Raw text received:', rawText);

      // Formatting logic
      function formatAdvice(text) {
        const lines = text.split('\n');
        let formattedHTML = '';
        let currentSection = '';
        let insideSection = false;

        lines.forEach((line, index) => {
          const trimmedLine = line.trim();

          // Skip empty lines
          if (trimmedLine === '') {
            return;
          }

          // Check for section heading (lines with ** at start and end, or ending with :)
          if ((trimmedLine.startsWith('**') && trimmedLine.endsWith(':**')) || 
              (trimmedLine.startsWith('**') && trimmedLine.endsWith('**') && trimmedLine.includes(':'))) {
            // Close previous section if exists
            if (insideSection) {
              currentSection += '</div>';
              formattedHTML += currentSection;
            }
            const heading = trimmedLine.replace(/\*\*/g, '').replace(/:$/, '');
            formattedHTML += `<h2 class="advice-heading"><strong>${heading}</strong>:</h2>`;
            currentSection = '<div class="advice-section">';
            insideSection = true;
          } 
          // Handle bullet list items (starts with *)
          else if (trimmedLine.startsWith('*')) {
            // Remove the bullet marker and any leading spaces
            let listItem = trimmedLine.replace(/^\*\s*/, '');
            // Convert **text** to <strong>text</strong>
            listItem = listItem.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
            
            if (!insideSection) {
              currentSection = '<div class="advice-section">';
              insideSection = true;
            }
            currentSection += `<div class="advice-card">${listItem}</div>`;
          } 
          // Handle regular paragraphs
          else {
            // Convert **text** to <strong>text</strong>
            const cleanLine = trimmedLine.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
            
            if (!insideSection) {
              currentSection = '<div class="advice-section">';
              insideSection = true;
            }
            currentSection += `<div class="advice-card">${cleanLine}</div>`;
          }

          // Close section at the end
          if (index === lines.length - 1 && insideSection) {
            currentSection += '</div>';
            formattedHTML += currentSection;
          }
        });

        return formattedHTML;
      }

      // Display formatted advice
      outputContent.innerHTML = `<div id="adviceContainer">${formatAdvice(rawText)}</div>`;
      console.log('Advice displayed successfully');

    } else {
      console.error('No candidates in response:', data);
      outputContent.innerHTML = "<div class='advice-card'>Sorry, I couldn't generate advice. Please try again.</div>";
    }
  } catch (error) {
    console.error('Error details:', error);
    console.error('Error stack:', error.stack);
    
    let errorMessage = "There was an error getting the advice. ";
    if (error.message) {
      errorMessage += error.message;
    } else {
      errorMessage += "Please check the console for details and try again.";
    }
    
    outputContent.innerHTML = `<div class='advice-card' style='background-color: #ffe6e6; border-color: #ff6b6b; color: #c92a2a;'>${errorMessage}</div>`;
  } finally {
    hideLoader();
    console.log('Request completed');
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
