// 🌐 Replace this with your Render backend URL
const API_BASE_URL = "https://daily-journal-backend-aq5z.onrender.com";

// --- Utility: Handle login cookie ---
function setCookie(name, value, days) {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = name + '=' + encodeURIComponent(value) + '; expires=' + expires + '; path=/';
}
function getCookie(name) {
  return document.cookie.split('; ').reduce((r, v) => {
    const parts = v.split('=');
    return parts[0] === name ? decodeURIComponent(parts[1]) : r
  }, '');
}
function eraseCookie(name) {
  document.cookie = name + '=; Max-Age=-99999999;';
}

// --- Page logic ---
document.addEventListener('DOMContentLoaded', () => {
  const path = window.location.pathname;

  if (path.includes('index.html') || path === '/' || path === '') {
    const loginBtn = document.getElementById('loginBtn');
    const registerBtn = document.getElementById('registerBtn');
    const msg = document.getElementById('msg');

    loginBtn.onclick = async () => {
      const username = document.getElementById('username').value;
      const password = document.getElementById('password').value;

      const res = await fetch(`${API_BASE_URL}/api/login`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({username, password})
      });

      const data = await res.json();
      if (data.success) {
        setCookie('token', data.token, 1);
        speak("Login successful. Welcome back!");
        window.location.href = 'journal.html';
      } else {
        msg.textContent = data.message;
        speak("Login failed. Please try again.");
      }
    };

    registerBtn.onclick = async () => {
      const username = document.getElementById('username').value;
      const password = document.getElementById('password').value;

      const res = await fetch(`${API_BASE_URL}/api/register`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({username, password})
      });

      const data = await res.json();
      msg.textContent = data.message;
      speak(data.message);
    };

  } else if (path.includes('journal.html')) {
    const token = getCookie('token');
    if (!token) {
      speak("Please log in first.");
      window.location.href = 'index.html';
      return;
    }

    const entryBox = document.getElementById('entry');
    const saveBtn = document.getElementById('saveBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    const entriesList = document.getElementById('entries');

    // Fetch past entries
    async function loadEntries() {
      const res = await fetch(`${API_BASE_URL}/api/entries`, {
        headers: {'Authorization': `Bearer ${token}`}
      });
      const data = await res.json();
      entriesList.innerHTML = '';
      data.forEach(e => {
        const li = document.createElement('li');
        li.textContent = e.content;
        entriesList.appendChild(li);
      });
    }

    saveBtn.onclick = async () => {
      const content = entryBox.value.trim();
      if (!content) {
        speak("Please write something before saving.");
        return;
      }

      const res = await fetch(`${API_BASE_URL}/api/entry`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({content})
      });

      const data = await res.json();
      if (data.success) {
        entryBox.value = '';
        speak("Entry saved successfully.");
        loadEntries();
      } else {
        speak("Failed to save entry.");
      }
    };

    logoutBtn.onclick = () => {
      eraseCookie('token');
      speak("Logged out successfully.");
      window.location.href = 'index.html';
    };

    loadEntries();
  }
});
