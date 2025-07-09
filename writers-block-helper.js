// writers-block-helper.js
// JavaScript for Writer's Block Helper

// --- Genre Add Logic ---
document.getElementById('addGenreBtn').addEventListener('click', function() {
  const customGenreInput = document.getElementById('customGenre');
  const genre = customGenreInput.value.trim();
  if (genre) {
    const genreList = document.querySelector('.genre-list');
    const label = document.createElement('label');
    label.innerHTML = `<input type="checkbox" name="genres" value="${genre}"><span> ${genre} ✨</span>`;
    genreList.appendChild(label);
    customGenreInput.value = '';
  }
});

// --- File Upload Logic ---
document.getElementById('storyFile').addEventListener('change', function(e) {
  const file = e.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function(evt) {
      document.getElementById('storyText').value = evt.target.result;
    };
    reader.readAsText(file);
  }
});

// --- Form Submission Logic ---
document.getElementById('writerForm').addEventListener('submit', async function(e) {
  e.preventDefault();
  const storyName = document.getElementById('storyName').value.trim();
  const genres = Array.from(document.querySelectorAll('input[name="genres"]:checked')).map(cb => cb.value);
  const storyText = document.getElementById('storyText').value.trim();
  const situation = document.getElementById('situation').value.trim();
  if (!storyName || genres.length === 0 || !situation || (!storyText)) {
    alert('Please fill in all required fields and provide some story text.');
    return;
  }
  showOutput('Analyzing your story... <span class="emoji">⏳</span>');
  try {
    const prompt = buildPrompt(storyName, genres, storyText, situation);
    const aiResponse = await callGeminiAPI(prompt);
    showOutput(formatAIResponse(aiResponse));
  } catch (err) {
    showOutput('<span class="emoji">❌</span> <b>Something went wrong:</b> ' + err.message);
  }
});

function showOutput(html) {
  const out = document.getElementById('outputSection');
  out.innerHTML = html;
  out.classList.add('visible');
  out.scrollIntoView({ behavior: 'smooth' });
}

function buildPrompt(storyName, genres, storyText, situation) {
  return `You are a creative writing assistant for writers with writer's block.\n\nStory Name: ${storyName}\nGenres: ${genres.join(', ')}\nSituation Tag: ${situation}\n\nStory Excerpt:\n${storyText}\n\nPlease provide:\n1. A short, creative brief of the story so far (with emojis).\n2. A detailed analysis of possible outcomes for the story.\n3. Suggestions for which path the story can take from here.\n4. Risks the writer can take in the story.\n5. A rating of the story out of 10 (with a creative reason and emoji).\n\nMake the output visually engaging, use appropriate emojis, and keep a writerly, bookish theme.`;
}

async function callGeminiAPI(prompt) {
  const apiKey = 'AIzaSyAw_ShPCqm24zDaaIHml0Gbi6M4cPeoo6Q';
  const url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=' + apiKey;
  const body = {
    contents: [{ parts: [{ text: prompt }] }]
  };
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  if (!res.ok) throw new Error('AI API error: ' + res.status);
  const data = await res.json();
  if (!data.candidates || !data.candidates[0] || !data.candidates[0].content || !data.candidates[0].content.parts[0].text) {
    throw new Error('No response from AI.');
  }
  return data.candidates[0].content.parts[0].text;
}

function formatAIResponse(text) {
  // Remove markdown bold (**), improve hierarchy, and beautify output
  // Replace numbered headings and subheadings with styled HTML
  let html = '';
  let lines = text.split(/\n+/);
  let inList = false;
  let inSubList = false;
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i].replace(/\*\*/g, '').trim(); // Remove all **
    // Main sections
    if (/^1\./.test(line)) {
      html += '<h2 class="out-h2"><span class="emoji">📚</span> Short Brief</h2><div class="divider"></div>';
      html += `<div class="out-main">${line.replace(/^1\.\s*/, '')}</div>`;
    } else if (/^2\./.test(line)) {
      html += '<h2 class="out-h2"><span class="emoji">🔮</span> Detailed Analysis</h2><div class="divider"></div>';
    } else if (/^3\./.test(line)) {
      html += '<h2 class="out-h2"><span class="emoji">🛤️</span> Possible Paths</h2><div class="divider"></div>';
    } else if (/^4\./.test(line)) {
      html += '<h2 class="out-h2"><span class="emoji">⚡</span> Risks to Take</h2><div class="divider"></div>';
    } else if (/^5\./.test(line)) {
      html += '<div class="divider"></div>';
      html += `<div class="rating"><span class="emoji">⭐</span> ${line.replace(/^5\.\s*/, '')}</div>`;
    // Subsection titles (e.g. The Benign Rescue:)
    } else if (/^\*/.test(line) && line.endsWith(':')) {
      if (inList) { html += '</ul>'; inList = false; }
      html += `<div class="out-subhead">${line.replace(/^\*+/, '').replace(/:$/, '').trim()}</div>`;
    // List items
    } else if (/^\*/.test(line)) {
      if (!inList) { html += '<ul class="out-list">'; inList = true; }
      html += `<li>${line.replace(/^\*+/, '').trim()}</li>`;
    } else if (line.startsWith('- ')) {
      if (!inList) { html += '<ul class="out-list">'; inList = true; }
      html += `<li>${line.replace(/^-\s*/, '')}</li>`;
    } else if (line === '' && inList) {
      html += '</ul>'; inList = false;
    } else if (line !== '') {
      html += `<div class="out-main">${line}</div>`;
    }
  }
  if (inList) html += '</ul>';
  return html;
} 