let currentSessionId = null;
let currentMessages = [];
let lastAiReply = "";

let calendarDate = new Date();

let timerSeconds = 25 * 60;
let timerInterval = null;

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
  const data = await api("/api/status");

  document.getElementById("aiStatus").textContent = "AI status: " + data.status;
}

function renderChat() {
  const chatBox = document.getElementById("chatMessages");

  chatBox.innerHTML = "";

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
        message
      }
    : {
        message
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
      <button onclick="renameSession('${session._id}')">Rename</button>
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
  const title = prompt("Enter the new session title:");

  if (!title) {
    return;
  }

  await api("/api/sessions/" + id, {
    method: "PATCH",
    body: JSON.stringify({
      title
    })
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
    alert("There is no AI reply yet.");
    return;
  }

  await api("/api/tasks", {
    method: "POST",
    body: JSON.stringify({
      text: lastAiReply.slice(0, 140)
    })
  });

  loadTasks();
}

async function createEventFromLastAi() {
  if (!lastAiReply) {
    alert("There is no AI reply yet.");
    return;
  }

  await api("/api/events/from-ai", {
    method: "POST",
    body: JSON.stringify({
      text: lastAiReply.slice(0, 180)
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
    body: JSON.stringify({
      text
    })
  });

  input.value = "";

  loadTasks();
}

async function toggleTask(id, completed) {
  await api("/api/tasks/" + id, {
    method: "PATCH",
    body: JSON.stringify({
      completed
    })
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
  renderEventList(events);
}

function renderCalendar(events) {
  const grid = document.getElementById("calendarGrid");
  const monthLabel = document.getElementById("monthLabel");

  grid.innerHTML = "";

  const year = calendarDate.getFullYear();
  const month = calendarDate.getMonth();

  monthLabel.textContent = calendarDate.toLocaleString("default", {
    month: "long",
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
      eventDiv.textContent = `${event.time || ""} ${event.title}`;

      cell.appendChild(eventDiv);
    });

    grid.appendChild(cell);
  }
}

function renderEventList(events) {
  const container = document.getElementById("eventList");

  container.innerHTML = "";

  events.forEach((event) => {
    const div = document.createElement("div");

    div.className = "event-item";

    div.innerHTML = `
      <strong>${escapeHtml(event.title)}</strong><br>
      Date: ${escapeHtml(event.date)}
      ${event.time ? " Time: " + escapeHtml(event.time) : ""}<br>
      Source: ${escapeHtml(event.source || "manual")}<br>
      <button onclick="editEvent('${event._id}')">Edit</button>
      <button onclick="deleteEvent('${event._id}')" class="danger">Delete</button>
    `;

    container.appendChild(div);
  });
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
  const time = document.getElementById("eventTime").value;

  if (!title || !date) {
    alert("Event title and date are required.");
    return;
  }

  await api("/api/events", {
    method: "POST",
    body: JSON.stringify({
      title,
      date,
      time
    })
  });

  document.getElementById("eventTitle").value = "";
  document.getElementById("eventDate").value = "";
  document.getElementById("eventTime").value = "";

  loadEvents();
}

async function editEvent(id) {
  const title = prompt("Enter updated event title:");

  if (!title) {
    return;
  }

  await api("/api/events/" + id, {
    method: "PATCH",
    body: JSON.stringify({
      title
    })
  });

  loadEvents();
}

async function deleteEvent(id) {
  await api("/api/events/" + id, {
    method: "DELETE"
  });

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
    timerSeconds = timerSeconds - 1;

    updateTimerDisplay();

    if (timerSeconds <= 0) {
      clearInterval(timerInterval);

      timerInterval = null;

      await api("/api/timer/log", {
        method: "POST",
        body: JSON.stringify({
          duration: 25
        })
      });

      timerSeconds = 25 * 60;

      updateTimerDisplay();

      loadStats();

      alert("Pomodoro complete. Study session logged.");
    }
  }, 1000);
}

function pauseTimer() {
  clearInterval(timerInterval);

  timerInterval = null;
}

function resetTimer() {
  pauseTimer();

  timerSeconds = 25 * 60;

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

checkAiStatus();
loadSessions();
loadTasks();
loadEvents();
loadStats();
updateTimerDisplay();