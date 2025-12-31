// Simplified app logic
let currentDate = null;

// Initialize app
document.addEventListener("DOMContentLoaded", async () => {
  // Initialize database
  const dbInitialized = await pushupDB.init();
  if (!dbInitialized) {
    alert("Failed to initialize database. Please refresh the page.");
    return;
  }

  // Update UI
  updateUI();

  // Set up event listeners
  setupEventListeners();
});

function setupEventListeners() {
  document.getElementById("doneBtn").addEventListener("click", handleDone);
  document.getElementById("undoBtn").addEventListener("click", handleUndo);
}

function handleDone() {
  const today = getTodayDate();

  // Add 20 pushups for today
  const success = pushupDB.addPushup(today, 20, "");

  if (success) {
    showDoneView();
    updateUI();
  } else {
    alert("Failed to save. Please try again.");
  }
}

function handleUndo() {
  const today = getTodayDate();

  // Get today's entries
  const entries = pushupDB.getPushupsByDate(today);

  if (entries.length > 0) {
    // Delete the most recent entry
    const lastEntry = entries[0];
    pushupDB.deletePushup(lastEntry.id);

    showNotDoneView();
    updateUI();
  }
}

function showDoneView() {
  document.getElementById("notDoneView").style.display = "none";
  document.getElementById("doneView").style.display = "block";
}

function showNotDoneView() {
  document.getElementById("notDoneView").style.display = "block";
  document.getElementById("doneView").style.display = "none";
}

function updateUI() {
  updateTodayDate();
  updateTodayStatus();
  updateStatistics();
  updateHistory();
}

function updateTodayDate() {
  const today = new Date();
  const options = {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  };
  const dateString = today.toLocaleDateString(undefined, options);
  document.getElementById("todayDate").textContent = dateString;
}

function updateTodayStatus() {
  const today = getTodayDate();
  const total = pushupDB.getTodayTotal(today);

  if (total >= 20) {
    showDoneView();
  } else {
    showNotDoneView();
  }
}

function updateStatistics() {
  const stats = pushupDB.getStatistics();

  document.getElementById("currentStreak").textContent = stats.streak;
  document.getElementById("daysCompleted").textContent = stats.daysCompleted;
}

function updateHistory() {
  const historyList = document.getElementById("historyList");
  const dailyTotals = pushupDB.getDailyTotals();

  if (dailyTotals.length === 0) {
    historyList.innerHTML = `
            <div class="empty-state">
                <p>No history yet</p>
                <p>Complete your first day! 💪</p>
            </div>
        `;
    return;
  }

  let html = "";

  // Show last 30 days
  dailyTotals.slice(0, 30).forEach((day) => {
    const formattedDate = formatDisplayDate(day.date);

    html += `
            <div class="history-item">
                <div class="history-item-left">
                    <div class="history-date">${formattedDate}</div>
                </div>
                <div class="history-check">✓</div>
            </div>
        `;
  });

  historyList.innerHTML = html;
}

// Utility functions
function getTodayDate() {
  const today = new Date();
  return pushupDB.formatDate(today);
}

function formatDisplayDate(dateStr) {
  const date = new Date(dateStr + "T00:00:00");
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const dateOnly = new Date(date);
  dateOnly.setHours(0, 0, 0, 0);

  if (dateOnly.getTime() === today.getTime()) {
    return "Today";
  } else if (dateOnly.getTime() === yesterday.getTime()) {
    return "Yesterday";
  } else {
    const options = { weekday: "short", month: "short", day: "numeric" };
    return date.toLocaleDateString(undefined, options);
  }
}

function showToast(message) {
  // Create toast element
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.textContent = message;
  document.body.appendChild(toast);

  // Trigger animation
  setTimeout(() => toast.classList.add("show"), 10);

  // Remove after 3 seconds
  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// Add toast styles dynamically
const toastStyles = document.createElement("style");
toastStyles.textContent = `
    .toast {
        position: fixed;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%) translateY(100px);
        background: #323232;
        color: white;
        padding: 12px 24px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        z-index: 10000;
        opacity: 0;
        transition: all 0.3s ease;
    }
    .toast.show {
        transform: translateX(-50%) translateY(0);
        opacity: 1;
    }
`;
document.head.appendChild(toastStyles);
