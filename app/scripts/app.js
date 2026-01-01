// Simplified app logic
let currentDate = null;
let selectedSkipReason = null;

// Exercise types
const EXERCISES = {
  PUSHUPS: "pushups",
  KNEES: "knees",
  ABS: "abs",
};

// Reason messages
const REASON_MESSAGES = {
  "not-feeling-ok": "Are you not feeling OK?",
  "too-tired": "Are you too tired?",
  "no-time": "Do you really have no time?",
  injured: "Are you injured?",
  other: "Are you sure you want to skip?",
};

// Initialize app
document.addEventListener("DOMContentLoaded", async () => {
  // Initialize database
  const dbInitialized = await pushupDB.init();
  if (!dbInitialized) {
    alert("Failed to initialize database. Please refresh the page.");
    return;
  }

  // Check for missed days and add debt
  checkMissedDays();

  // Update UI
  updateUI();

  // Set up event listeners
  setupEventListeners();
});

function checkMissedDays() {
  const today = getTodayDate();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  // Get all dates with pushup entries
  const dailyTotals = pushupDB.getDailyTotals();
  const datesWithPushups = dailyTotals.map((d) => d.date);

  // Get all dates with debt entries
  const allDebt = pushupDB.getAllDebt();
  const datesWithDebt = allDebt.map((d) => d.date);

  // Check last 30 days for missed pushups
  for (let i = 1; i <= 30; i++) {
    const checkDate = new Date();
    checkDate.setDate(checkDate.getDate() - i);
    const dateStr = pushupDB.formatDate(checkDate);

    // Stop checking if we reach a date before any records
    if (
      dailyTotals.length > 0 &&
      dateStr < dailyTotals[dailyTotals.length - 1].date
    ) {
      break;
    }

    // Check if this date had pushups
    const entries = pushupDB.getPushupsByDate(dateStr);
    const hadPushups = entries.some((e) => e.note === EXERCISES.PUSHUPS);

    // Check if this date already has debt recorded
    const hasDebt = datesWithDebt.includes(dateStr);

    // If no pushups and no debt recorded, add debt for missed day
    if (!hadPushups && !hasDebt && dateStr !== today) {
      // Only add debt if there are some records (user has started using the app)
      if (dailyTotals.length > 0 || allDebt.length > 0) {
        pushupDB.addDebt(dateStr, "missed-day", 20);
      }
    }
  }
}

function setupEventListeners() {
  // Pushups
  document
    .getElementById("pushupsDoneBtn")
    .addEventListener("click", () => handleExerciseDone(EXERCISES.PUSHUPS));
  document
    .getElementById("pushupsUndoBtn")
    .addEventListener("click", () => handleExerciseUndo(EXERCISES.PUSHUPS));
  document
    .getElementById("pushupsSkipBtn")
    .addEventListener("click", openSkipModal);

  // Knees
  document
    .getElementById("kneesDoneBtn")
    .addEventListener("click", () => handleExerciseDone(EXERCISES.KNEES));
  document
    .getElementById("kneesUndoBtn")
    .addEventListener("click", () => handleExerciseUndo(EXERCISES.KNEES));

  // Abs
  document
    .getElementById("absDoneBtn")
    .addEventListener("click", () => handleExerciseDone(EXERCISES.ABS));
  document
    .getElementById("absUndoBtn")
    .addEventListener("click", () => handleExerciseUndo(EXERCISES.ABS));

  // Modal buttons
  document
    .getElementById("cancelSkipBtn")
    .addEventListener("click", closeSkipModal);
  document
    .getElementById("cancelConfirmBtn")
    .addEventListener("click", closeConfirmModal);
  document
    .getElementById("confirmSkipBtn")
    .addEventListener("click", confirmSkip);

  // Reason buttons
  document.querySelectorAll(".reason-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const reason = e.currentTarget.getAttribute("data-reason");
      handleReasonSelected(reason);
    });
  });
}

function handleExerciseDone(exerciseType) {
  const today = getTodayDate();

  // Calculate amount including debt for pushups
  let amount = exerciseType === EXERCISES.PUSHUPS ? 20 : 1;
  let paidDebt = 0;

  if (exerciseType === EXERCISES.PUSHUPS) {
    const unpaidDebt = pushupDB.getUnpaidDebt();
    if (unpaidDebt > 0) {
      // Double the pushups to pay off debt
      amount = 20 + unpaidDebt;
      paidDebt = pushupDB.payOffDebt(unpaidDebt);
    }
  }

  const note = exerciseType;
  const success = pushupDB.addPushup(today, amount, note);

  if (success) {
    updateUI();
    if (paidDebt > 0) {
      showToast(
        `${getExerciseName(
          exerciseType
        )} completed! Paid off ${paidDebt} debt pushups! 💪`
      );
    } else {
      showToast(`${getExerciseName(exerciseType)} completed! 🎉`);
    }
  } else {
    alert("Failed to save. Please try again.");
  }
}

function handleExerciseUndo(exerciseType) {
  const today = getTodayDate();

  // Get today's entries for this exercise
  const entries = pushupDB
    .getPushupsByDate(today)
    .filter((e) => e.note === exerciseType);

  if (entries.length > 0) {
    // Delete the most recent entry
    const lastEntry = entries[0];
    pushupDB.deletePushup(lastEntry.id);

    updateUI();
    showToast(`${getExerciseName(exerciseType)} undone`);
  }
}

function getExerciseName(exerciseType) {
  const names = {
    [EXERCISES.PUSHUPS]: "Pushups",
    [EXERCISES.KNEES]: "Knee Strength",
    [EXERCISES.ABS]: "Abs Workout",
  };
  return names[exerciseType] || exerciseType;
}

// Modal functions
function openSkipModal() {
  document.getElementById("skipModal").style.display = "flex";
}

function closeSkipModal() {
  document.getElementById("skipModal").style.display = "none";
  selectedSkipReason = null;
}

function openConfirmModal(reason) {
  const modal = document.getElementById("confirmModal");
  const message = REASON_MESSAGES[reason] || "Are you sure you want to skip?";

  document.getElementById("confirmTitle").textContent = message;
  document.getElementById("confirmMessage").textContent =
    "This will add 20 pushups to your debt. You'll need to do them later along with your regular pushups.";

  modal.style.display = "flex";
}

function closeConfirmModal() {
  document.getElementById("confirmModal").style.display = "none";
  selectedSkipReason = null;
}

function handleReasonSelected(reason) {
  selectedSkipReason = reason;
  closeSkipModal();
  openConfirmModal(reason);
}

function confirmSkip() {
  if (!selectedSkipReason) return;

  const today = getTodayDate();
  const success = pushupDB.addDebt(today, selectedSkipReason, 20);

  if (success) {
    closeConfirmModal();
    updateUI();
    showToast("Pushups skipped. 20 pushups added to your debt. 😔");
  } else {
    alert("Failed to save. Please try again.");
  }
}

function updateUI() {
  updateTodayDate();
  updateDebtDisplay();
  updateExerciseStatuses();
  updateStatistics();
  updateHistory();
  updateDebtTable();
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
  document.getElementById("currentDate").textContent = dateString;
}

function updateDebtDisplay() {
  const unpaidDebt = pushupDB.getUnpaidDebt();
  const debtAlert = document.getElementById("pushupsDebt");
  const debtAmountEl = document.getElementById("debtAmount");
  const goalEl = document.getElementById("pushupsGoal");

  if (unpaidDebt > 0) {
    debtAlert.style.display = "flex";
    debtAmountEl.textContent = unpaidDebt;
    goalEl.textContent = `${
      20 + unpaidDebt
    } reps (${20} + ${unpaidDebt} debt) • Daily`;
  } else {
    debtAlert.style.display = "none";
    goalEl.textContent = "20 reps • Daily";
  }
}

function updateDebtTable() {
  const debtSection = document.getElementById("debtSection");
  const debtTableBody = document.getElementById("debtTableBody");

  // Only update if elements exist (they're on history page, not main page)
  if (!debtSection || !debtTableBody) return;

  const allDebt = pushupDB.getAllDebt();

  if (allDebt.length === 0) {
    debtSection.style.display = "none";
    return;
  }

  debtSection.style.display = "block";

  let html = "";
  allDebt.forEach((debt) => {
    const formattedDate = formatDisplayDate(debt.date);
    const reasonText = debt.reason
      .replace(/-/g, " ")
      .replace(/\b\w/g, (l) => l.toUpperCase());
    const statusClass = debt.paid ? "paid" : "pending";
    const statusText = debt.paid ? "Paid" : "Pending";

    html += `
      <tr>
        <td>${formattedDate}</td>
        <td>${reasonText}</td>
        <td>${debt.amount}</td>
        <td><span class="debt-status ${statusClass}">${statusText}</span></td>
      </tr>
    `;
  });

  debtTableBody.innerHTML = html;
}

function updateExerciseStatuses() {
  const today = getTodayDate();
  const entries = pushupDB.getPushupsByDate(today);

  // Update Pushups
  updateExerciseCard(EXERCISES.PUSHUPS, entries);

  // Update Knees
  updateExerciseCard(EXERCISES.KNEES, entries);

  // Update Abs (with weekly count)
  updateExerciseCard(EXERCISES.ABS, entries);
  updateAbsWeeklyProgress();
}

function updateExerciseCard(exerciseType, entries) {
  const completed = entries.some((e) => e.note === exerciseType);
  const card = document.querySelector(`[data-exercise="${exerciseType}"]`);
  const statusBadge = document
    .getElementById(`${exerciseType}Status`)
    .querySelector(".status-badge");
  const doneBtn = document.getElementById(`${exerciseType}DoneBtn`);
  const undoBtn = document.getElementById(`${exerciseType}UndoBtn`);

  if (completed) {
    card.classList.add("completed");
    statusBadge.textContent = "Completed";
    statusBadge.classList.remove("pending");
    statusBadge.classList.add("completed");
    doneBtn.style.display = "none";
    undoBtn.style.display = "block";
  } else {
    card.classList.remove("completed");
    statusBadge.textContent = "Pending";
    statusBadge.classList.remove("completed");
    statusBadge.classList.add("pending");
    doneBtn.style.display = "block";
    undoBtn.style.display = "none";
  }
}

function updateAbsWeeklyProgress() {
  const weekStart = getWeekStart();
  const weekEnd = new Date();

  let count = 0;
  let currentDate = new Date(weekStart);

  while (currentDate <= weekEnd) {
    const dateStr = pushupDB.formatDate(currentDate);
    const entries = pushupDB.getPushupsByDate(dateStr);
    if (entries.some((e) => e.note === EXERCISES.ABS)) {
      count++;
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }

  const progressEl = document.getElementById("absWeeklyProgress");
  progressEl.querySelector(
    ".weekly-count"
  ).textContent = `${count}/3 this week`;
}

function getWeekStart() {
  const today = new Date();
  const day = today.getDay();
  const diff = today.getDate() - day + (day === 0 ? -6 : 1); // Monday as start
  return new Date(today.setDate(diff));
}

function updateStatistics() {
  // Calculate pushup-specific streak
  const pushupStreak = calculatePushupStreak();
  const stats = pushupDB.getStatistics();

  document.getElementById("currentStreak").textContent = pushupStreak;
  document.getElementById("daysCompleted").textContent = stats.daysCompleted;
}

function calculatePushupStreak() {
  const today = new Date();
  let streak = 0;
  let currentDate = new Date(today);

  while (true) {
    const dateStr = pushupDB.formatDate(currentDate);
    const entries = pushupDB.getPushupsByDate(dateStr);
    const hasPushups = entries.some((e) => e.note === EXERCISES.PUSHUPS);

    if (hasPushups) {
      streak++;
      currentDate.setDate(currentDate.getDate() - 1);
    } else {
      // Check if it's today and not done yet
      if (dateStr === pushupDB.formatDate(today)) {
        // Today not done yet, check yesterday
        currentDate.setDate(currentDate.getDate() - 1);
        continue;
      }
      break;
    }
  }

  return streak;
}

function updateHistory() {
  const historyList = document.getElementById("historyList");

  // Only update if element exists (it's on history page, not main page)
  if (!historyList) return;

  const dailyTotals = pushupDB.getDailyTotals();

  if (dailyTotals.length === 0) {
    historyList.innerHTML = `
            <div class="empty-state">
                <p>No history yet</p>
                <p>Complete your first exercise! 💪</p>
            </div>
        `;
    return;
  }

  let html = "";

  // Show last 30 days
  dailyTotals.slice(0, 30).forEach((day) => {
    const formattedDate = formatDisplayDate(day.date);
    const entries = pushupDB.getPushupsByDate(day.date);

    // Count completed exercises for this day
    const hasPushups = entries.some((e) => e.note === EXERCISES.PUSHUPS);
    const hasKnees = entries.some((e) => e.note === EXERCISES.KNEES);
    const hasAbs = entries.some((e) => e.note === EXERCISES.ABS);

    const exerciseIcons = [];
    if (hasPushups) exerciseIcons.push("💪");
    if (hasKnees) exerciseIcons.push("🦵");
    if (hasAbs) exerciseIcons.push("🔥");

    html += `
            <div class="history-item">
                <div class="history-item-left">
                    <div class="history-date">${formattedDate}</div>
                    <div class="history-exercises">${exerciseIcons.join(
                      " "
                    )}</div>
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
