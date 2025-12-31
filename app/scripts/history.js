// History page logic
let currentFilter = 'all';

// Exercise types
const EXERCISES = {
  PUSHUPS: 'pushups',
  KNEES: 'knees',
  ABS: 'abs'
};

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
  // Filter buttons
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const filter = e.target.getAttribute('data-filter');
      setFilter(filter);
    });
  });
}

function setFilter(filter) {
  currentFilter = filter;
  
  // Update active button
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.classList.remove('active');
    if (btn.getAttribute('data-filter') === filter) {
      btn.classList.add('active');
    }
  });
  
  updateHistory();
}

function updateUI() {
  updateTodayDate();
  updateDebtSummary();
  updateDebtTable();
  updateHistory();
  updateStatistics();
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

function updateDebtSummary() {
  const allDebt = pushupDB.getAllDebt();
  const debtSection = document.getElementById("debtSection");
  
  if (allDebt.length === 0) {
    debtSection.style.display = "none";
    return;
  }
  
  debtSection.style.display = "block";
  
  const totalDebt = allDebt.reduce((sum, debt) => sum + debt.amount, 0);
  const paidDebt = allDebt.filter(d => d.paid).reduce((sum, debt) => sum + debt.amount, 0);
  const unpaidDebt = totalDebt - paidDebt;
  
  document.getElementById("totalDebt").textContent = totalDebt;
  document.getElementById("paidDebt").textContent = paidDebt;
  document.getElementById("unpaidDebt").textContent = unpaidDebt;
}

function updateDebtTable() {
  const allDebt = pushupDB.getAllDebt();
  const debtTableBody = document.getElementById("debtTableBody");

  if (allDebt.length === 0) {
    return;
  }
  
  let html = "";
  allDebt.forEach(debt => {
    const formattedDate = formatDisplayDate(debt.date);
    const reasonText = debt.reason.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    const statusClass = debt.paid ? 'paid' : 'pending';
    const statusText = debt.paid ? 'Paid' : 'Pending';

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

function updateHistory() {
  const historyList = document.getElementById("historyList");
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

  // Show all days
  dailyTotals.forEach((day) => {
    const formattedDate = formatDisplayDate(day.date);
    const entries = pushupDB.getPushupsByDate(day.date);
    
    // Count completed exercises for this day
    const hasPushups = entries.some(e => e.note === EXERCISES.PUSHUPS);
    const hasKnees = entries.some(e => e.note === EXERCISES.KNEES);
    const hasAbs = entries.some(e => e.note === EXERCISES.ABS);
    
    // Apply filter
    if (currentFilter !== 'all') {
      if (currentFilter === EXERCISES.PUSHUPS && !hasPushups) return;
      if (currentFilter === EXERCISES.KNEES && !hasKnees) return;
      if (currentFilter === EXERCISES.ABS && !hasAbs) return;
    }
    
    const exerciseIcons = [];
    if (hasPushups) exerciseIcons.push('💪');
    if (hasKnees) exerciseIcons.push('🦵');
    if (hasAbs) exerciseIcons.push('🔥');

    // Get pushup count for this day
    const pushupCount = entries
      .filter(e => e.note === EXERCISES.PUSHUPS)
      .reduce((sum, e) => sum + e.count, 0);

    html += `
      <div class="history-item">
        <div class="history-item-left">
          <div class="history-date">${formattedDate}</div>
          <div class="history-exercises">${exerciseIcons.join(' ')}</div>
          ${pushupCount > 0 ? `<div class="history-count">${pushupCount} pushups</div>` : ''}
        </div>
        <div class="history-check">✓</div>
      </div>
    `;
  });

  if (html === "") {
    historyList.innerHTML = `
      <div class="empty-state">
        <p>No entries for this filter</p>
      </div>
    `;
  } else {
    historyList.innerHTML = html;
  }
}

function updateStatistics() {
  const allEntries = pushupDB.getAllPushups();
  const dailyTotals = pushupDB.getDailyTotals();
  
  // Calculate pushup-specific streak
  const pushupStreak = calculatePushupStreak();
  
  // Total pushups
  const totalPushups = allEntries
    .filter(e => e.note === EXERCISES.PUSHUPS)
    .reduce((sum, e) => sum + e.count, 0);
  
  // Total knee workouts
  const totalKnees = allEntries.filter(e => e.note === EXERCISES.KNEES).length;
  
  // Total abs workouts
  const totalAbs = allEntries.filter(e => e.note === EXERCISES.ABS).length;
  
  // Days with at least one exercise
  const daysCompleted = dailyTotals.length;
  
  // Completion rate (days with pushups vs total days since first entry)
  let completionRate = 0;
  if (dailyTotals.length > 0) {
    const firstDate = new Date(dailyTotals[dailyTotals.length - 1].date);
    const today = new Date();
    const daysSinceStart = Math.floor((today - firstDate) / (1000 * 60 * 60 * 24)) + 1;
    const daysWithPushups = dailyTotals.filter(day => {
      const entries = pushupDB.getPushupsByDate(day.date);
      return entries.some(e => e.note === EXERCISES.PUSHUPS);
    }).length;
    completionRate = Math.round((daysWithPushups / daysSinceStart) * 100);
  }
  
  document.getElementById("currentStreak").textContent = pushupStreak;
  document.getElementById("daysCompleted").textContent = daysCompleted;
  document.getElementById("totalPushups").textContent = totalPushups;
  document.getElementById("totalKnees").textContent = totalKnees;
  document.getElementById("totalAbs").textContent = totalAbs;
  document.getElementById("completionRate").textContent = completionRate + '%';
}

function calculatePushupStreak() {
  const today = new Date();
  let streak = 0;
  let currentDate = new Date(today);
  
  while (true) {
    const dateStr = pushupDB.formatDate(currentDate);
    const entries = pushupDB.getPushupsByDate(dateStr);
    const hasPushups = entries.some(e => e.note === EXERCISES.PUSHUPS);
    
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

// Utility functions
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
    const options = { weekday: "short", month: "short", day: "numeric", year: "numeric" };
    return date.toLocaleDateString(undefined, options);
  }
}

