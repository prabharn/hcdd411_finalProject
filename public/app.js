let currentSessionId = null;
let currentMessages = [];
let lastAiReply = "";

let calendarDate = new Date();

let timerSeconds = 25 * 60;
let timerInterval = null;

const defaultSettings = {
  model: "gemini-2.0-flash",
  pomodoroMinutes: 25,
  theme: "dark",
  density: "compact",
  accent: "#38bdf8"
};

let settings = loadSettings();

function loadSettings() {
  const saved = localStorage.getItem("booklightSettings");

  if (!saved) {
    return { ...defaultSettings };
  }

  return {
    ...defaultSettings,
    ...JSON.parse(saved)
  };
}

function applySettings() {
  document.body.classList.toggle("light", settings.theme === "light");
  document.body.classList.toggle("comfortable", settings.density === "comfortable");
  document.documentElement.style.setProperty("--accent", settings.accent);

  timerSeconds = Number(settings.pomodoroMinutes) * 60;
  updateTimerDisplay();

  document.getElementById("settingModel").value = settings.model;
  document.getElementById("settingPomodoro").value = settings.pomodoroMinutes;
  document.getElementById("settingTheme").value = settings.theme;
  document.getElementById("settingDensity").value = settings.density;
  document.getElementById("settingAccent").value = settings.accent;
}

function saveSettings() {
  settings = {
    model: document.getElementById("settingModel").value,
    pomodoroMinutes: Number(document.getElementById("settingPomodoro").value),
    theme: document.getElementById("settingTheme").value,
    density: document.getElementById("settingDensity").value,
    accent: document.getElementById("settingAccent").value
  };

  localStorage.setItem("booklightSettings", JSON.stringify(settings));
  applySettings();

  document.getElementById("settingsNote").textContent = "Settings saved.";
  checkAiStatus();
}

function resetSettings() {
  settings = { ...defaultSettings };
  localStorage.setItem("booklightSettings", JSON.stringify(settings));
  applySettings();

  document.getElementById("settingsNote").textContent = "Settings reset.";
  checkAiStatus();
}

function showPage(page) {
  document.getElementById("dashboardPage").classList.toggle("hidden", page !== "dashboard");
  document.getElementById("settingsPage").classList.toggle("hidden", page !== "settings");
}

async function api(path, options = {}) {
  const response = await fetch(path, {
    headers: {
      "Content-Type": "application/json"
    },
    ...options
  });

  return response.json();
}

function escapeHtml(text) {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

// ---------------- AI CHAT ----------------

async function checkAiStatus() {
  const data = await api("/api/status?model=" + encodeURIComponent(settings.model));
  const status = document.getElementById("aiStatus");

  status.textContent = "Gemini: " + data.status + (data.message ? " — " + data.message : "");
  status.className = "status-pill " + data.status;
}

function renderChat() {
  const chatBox = document.getElementById("chatMessages");

  chatBox.innerHTML = "";

  if (currentMessages.length === 0) {
    const empty = document.createElement("div");
    empty.className = "message ai";
    empty.textContent = "Ask a study question. Sessions save automatically.";
    chatBox.appendChild(empty);
    return;
  }

  currentMessages.forEach((message) => {
    const div = document.createElement("div");

    div.className = "message " + message.role;
    div.textContent = message.text;

    chatBox.appendChild(div);
  });

  chatBox.scrollTop = chatBox.scrollHeight;
}

async function sendMessage() {
  const input = document.getElementById("chatInput");
  const message = input.value.trim();

  if (!message) {
    return;
  }

  currentMessages.push({
    role: "user",
    text: message
  });

  renderChat();

  input.value = "";

  const endpoint = currentSessionId ? "/api/chat/continue" : "/api/chat";

  const payload = currentSessionId
    ? {
        sessionId: currentSessionId,
        message,
        model: settings.model
      }
    : {
        message,
        model: settings.model
      };

  const data = await api(endpoint, {
    method: "POST",
    body: JSON.stringify(payload)
  });

  if (data.error) {
    currentMessages.push({
      role: "ai",
      text: data.error
    });

    renderChat();
    checkAiStatus();
    return;
  }

  if (data.sessionId) {
    currentSessionId = data.sessionId;
  }

  lastAiReply = data.reply;

  currentMessages.push({
    role: "ai",
    text: data.reply
  });

  renderChat();
  loadSessions();
}

function newChat() {
  currentSessionId = null;
  currentMessages = [];
  lastAiReply = "";

  renderChat();
}

async function loadSessions() {
  const sessions = await api("/api/sessions");
  const container = document.getElementById("sessionsList");

  container.innerHTML = "";

  sessions.forEach((session) => {
    const div = document.createElement("div");

    div.className = "session-item";

    div.innerHTML = `
      <strong>${escapeHtml(session.title)}</strong><br>
      <button onclick="openSession('${session._id}')">Open</button>
      <button onclick="renameSession('${session._id}')" class="secondary">Rename</button>
      <button onclick="deleteSession('${session._id}')" class="danger">Delete</button>
    `;

    container.appendChild(div);
  });
}

async function openSession(id) {
  const session = await api("/api/sessions/" + id);

  currentSessionId = session._id;
  currentMessages = session.messages;
  lastAiReply = "";

  for (let i = currentMessages.length - 1; i >= 0; i--) {
    if (currentMessages[i].role === "ai") {
      lastAiReply = currentMessages[i].text;
      break;
    }
  }

  renderChat();
}

async function renameSession(id) {
  const title = prompt("New session title:");

  if (!title) {
    return;
  }

  await api("/api/sessions/" + id, {
    method: "PATCH",
    body: JSON.stringify({ title })
  });

  loadSessions();
}

async function deleteSession(id) {
  await api("/api/sessions/" + id, {
    method: "DELETE"
  });

  if (currentSessionId === id) {
    newChat();
  }

  loadSessions();
}

async function createTaskFromLastAi() {
  if (!lastAiReply) {
    alert("No AI reply yet.");
    return;
  }

  await api("/api/tasks", {
    method: "POST",
    body: JSON.stringify({
      text: lastAiReply.slice(0, 120)
    })
  });

  loadTasks();
}

async function createEventFromLastAi() {
  if (!lastAiReply) {
    alert("No AI reply yet.");
    return;
  }

  await api("/api/events/from-ai", {
    method: "POST",
    body: JSON.stringify({
      text: lastAiReply.slice(0, 150)
    })
  });

  loadEvents();
}

// ---------------- TASKS ----------------

async function loadTasks() {
  const tasks = await api("/api/tasks");
  const container = document.getElementById("taskList");

  container.innerHTML = "";

  tasks.forEach((task) => {
    const div = document.createElement("div");

    div.className = "task-item";

    if (task.completed) {
      div.classList.add("done");
    }

    div.innerHTML = `
      <input
        type="checkbox"
        ${task.completed ? "checked" : ""}
        onchange="toggleTask('${task._id}', this.checked)"
      />
      ${escapeHtml(task.text)}
      <button onclick="deleteTask('${task._id}')" class="danger">Delete</button>
    `;

    container.appendChild(div);
  });
}

async function addTask() {
  const input = document.getElementById("taskInput");
  const text = input.value.trim();

  if (!text) {
    return;
  }

  await api("/api/tasks", {
    method: "POST",
    body: JSON.stringify({ text })
  });

  input.value = "";
  loadTasks();
}

async function toggleTask(id, completed) {
  await api("/api/tasks/" + id, {
    method: "PATCH",
    body: JSON.stringify({ completed })
  });

  loadTasks();
}

async function deleteTask(id) {
  await api("/api/tasks/" + id, {
    method: "DELETE"
  });

  loadTasks();
}

async function clearCompletedTasks() {
  const tasks = await api("/api/tasks");
  const completedTasks = tasks.filter((task) => task.completed);

  for (const task of completedTasks) {
    await api("/api/tasks/" + task._id, {
      method: "DELETE"
    });
  }

  loadTasks();
}

// ---------------- CALENDAR ----------------

function getMonthKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");

  return `${year}-${month}`;
}

async function loadEvents() {
  const monthKey = getMonthKey(calendarDate);
  const events = await api("/api/events?month=" + monthKey);

  renderCalendar(events);
}

function renderCalendar(events) {
  const grid = document.getElementById("calendarGrid");
  const monthLabel = document.getElementById("monthLabel");

  grid.innerHTML = "";

  const year = calendarDate.getFullYear();
  const month = calendarDate.getMonth();

  monthLabel.textContent = calendarDate.toLocaleString("default", {
    month: "short",
    year: "numeric"
  });

  const firstDay = new Date(year, month, 1);
  const startDate = new Date(firstDay);

  startDate.setDate(firstDay.getDate() - firstDay.getDay());

  for (let i = 0; i < 42; i++) {
    const cellDate = new Date(startDate);

    cellDate.setDate(startDate.getDate() + i);

    const isoDate = cellDate.toISOString().slice(0, 10);

    const cell = document.createElement("div");

    cell.className = "calendar-cell";

    const day = document.createElement("div");

    day.className = "calendar-day";
    day.textContent = cellDate.getDate();

    cell.appendChild(day);

    const dayEvents = events.filter((event) => event.date === isoDate);

    dayEvents.forEach((event) => {
      const eventDiv = document.createElement("div");

      eventDiv.className = "calendar-event";
      eventDiv.textContent = event.title;

      cell.appendChild(eventDiv);
    });

    grid.appendChild(cell);
  }
}

function previousMonth() {
  calendarDate.setMonth(calendarDate.getMonth() - 1);
  loadEvents();
}

function nextMonth() {
  calendarDate.setMonth(calendarDate.getMonth() + 1);
  loadEvents();
}

async function addEvent() {
  const title = document.getElementById("eventTitle").value.trim();
  const date = document.getElementById("eventDate").value;

  if (!title || !date) {
    alert("Event title and date are required.");
    return;
  }

  await api("/api/events", {
    method: "POST",
    body: JSON.stringify({
      title,
      date
    })
  });

  document.getElementById("eventTitle").value = "";
  document.getElementById("eventDate").value = "";

  loadEvents();
}

// ---------------- TIMER ----------------

function updateTimerDisplay() {
  const minutes = Math.floor(timerSeconds / 60);
  const seconds = timerSeconds % 60;

  document.getElementById("timerDisplay").textContent =
    String(minutes).padStart(2, "0") + ":" + String(seconds).padStart(2, "0");
}

function startTimer() {
  if (timerInterval) {
    return;
  }

  timerInterval = setInterval(async () => {
    timerSeconds--;

    updateTimerDisplay();

    if (timerSeconds <= 0) {
      clearInterval(timerInterval);
      timerInterval = null;

      await api("/api/timer/log", {
        method: "POST",
        body: JSON.stringify({
          duration: Number(settings.pomodoroMinutes)
        })
      });

      timerSeconds = Number(settings.pomodoroMinutes) * 60;

      updateTimerDisplay();
      loadStats();

      alert("Pomodoro complete.");
    }
  }, 1000);
}

function pauseTimer() {
  clearInterval(timerInterval);
  timerInterval = null;
}

function resetTimer() {
  pauseTimer();
  timerSeconds = Number(settings.pomodoroMinutes) * 60;
  updateTimerDisplay();
}

async function loadStats() {
  const day = await api("/api/stats/day");
  const week = await api("/api/stats/week");
  const month = await api("/api/stats/month");

  document.getElementById("dayStats").textContent = day.totalMinutes;
  document.getElementById("weekStats").textContent = week.totalMinutes;
  document.getElementById("monthStats").textContent = month.totalMinutes;
}

// ---------------- INITIAL LOAD ----------------

applySettings();
checkAiStatus();
renderChat();
loadSessions();
loadTasks();
loadEvents();
loadStats();