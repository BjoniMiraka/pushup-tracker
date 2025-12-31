// Notification management
class NotificationManager {
    constructor() {
        this.notificationTime = { hour: 20, minute: 0 }; // 8 PM
        this.checkInterval = null;
    }

    async init() {
        this.updateNotificationUI();
        
        // Check notification permission status
        if ('Notification' in window) {
            if (Notification.permission === 'granted') {
                this.startNotificationCheck();
            }
        }

        // Set up notification toggle button
        const toggleBtn = document.getElementById('notificationToggle');
        toggleBtn.addEventListener('click', () => this.toggleNotifications());
    }

    async toggleNotifications() {
        if (!('Notification' in window)) {
            alert('This browser does not support notifications');
            return;
        }

        if (Notification.permission === 'granted') {
            // Disable notifications
            this.stopNotificationCheck();
            localStorage.setItem('notificationsEnabled', 'false');
            this.updateNotificationUI();
            showToast('Notifications disabled');
        } else if (Notification.permission === 'denied') {
            alert('Notifications are blocked. Please enable them in your browser settings.');
        } else {
            // Request permission
            const permission = await Notification.requestPermission();
            if (permission === 'granted') {
                this.startNotificationCheck();
                localStorage.setItem('notificationsEnabled', 'true');
                this.updateNotificationUI();
                showToast('Notifications enabled! You\'ll be reminded at 8 PM daily.');
                
                // Show a test notification
                this.showNotification('Notifications Enabled!', {
                    body: 'You\'ll receive daily reminders to complete your pushups.',
                    icon: '../icons/icon-192.svg'
                });
            }
        }
    }

    startNotificationCheck() {
        // Clear any existing interval
        this.stopNotificationCheck();

        // Check every minute
        this.checkInterval = setInterval(() => {
            this.checkAndNotify();
        }, 60000); // 60 seconds

        // Also check immediately
        this.checkAndNotify();
    }

    stopNotificationCheck() {
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
            this.checkInterval = null;
        }
    }

    checkAndNotify() {
        const now = new Date();
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();

        // Check if it's notification time (8 PM)
        if (currentHour === this.notificationTime.hour && 
            currentMinute === this.notificationTime.minute) {
            
            // Check if user has completed their goal today
            const today = pushupDB.formatDate(now);
            const todayTotal = pushupDB.getTodayTotal(today);

            if (todayTotal < 20) {
                const remaining = 20 - todayTotal;
                this.showNotification('Time for Pushups! 💪', {
                    body: `You still need ${remaining} pushups to reach your daily goal of 20.`,
                    icon: '../icons/icon-192.svg',
                    badge: '../icons/icon-192.svg',
                    tag: 'daily-reminder',
                    requireInteraction: true
                });
            } else {
                // Congratulate them
                this.showNotification('Great Job! 🎉', {
                    body: `You've completed your daily goal with ${todayTotal} pushups!`,
                    icon: '../icons/icon-192.svg',
                    tag: 'daily-reminder'
                });
            }

            // Mark that we've sent today's notification
            localStorage.setItem('lastNotificationDate', today);
        }
    }

    showNotification(title, options = {}) {
        if (Notification.permission === 'granted') {
            const notification = new Notification(title, {
                ...options,
                vibrate: [200, 100, 200]
            });

            notification.onclick = () => {
                window.focus();
                notification.close();
            };

            return notification;
        }
    }

    updateNotificationUI() {
        const toggleBtn = document.getElementById('notificationToggle');
        const statusText = document.getElementById('notificationStatus');

        if (!('Notification' in window)) {
            toggleBtn.disabled = true;
            toggleBtn.textContent = 'Not Supported';
            statusText.textContent = 'Notifications are not supported in this browser';
            return;
        }

        const permission = Notification.permission;
        const enabled = localStorage.getItem('notificationsEnabled') === 'true';

        if (permission === 'granted' && enabled) {
            toggleBtn.textContent = 'Disable Notifications';
            toggleBtn.classList.remove('btn-secondary');
            toggleBtn.classList.add('btn-primary');
            statusText.textContent = 'You\'ll receive a reminder at 8 PM daily';
            statusText.style.color = 'var(--primary-color)';
        } else if (permission === 'denied') {
            toggleBtn.textContent = 'Blocked';
            toggleBtn.disabled = true;
            statusText.textContent = 'Notifications are blocked. Enable them in browser settings.';
            statusText.style.color = 'var(--danger-color)';
        } else {
            toggleBtn.textContent = 'Enable Notifications';
            toggleBtn.classList.remove('btn-primary');
            toggleBtn.classList.add('btn-secondary');
            statusText.textContent = 'Notifications are disabled';
            statusText.style.color = 'var(--text-secondary)';
        }
    }

    // Check at midnight if user missed their goal
    scheduleMidnightCheck() {
        const now = new Date();
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);
        
        const timeUntilMidnight = tomorrow.getTime() - now.getTime();

        setTimeout(() => {
            this.checkMissedGoal();
            // Schedule next midnight check
            this.scheduleMidnightCheck();
        }, timeUntilMidnight);
    }

    checkMissedGoal() {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = pushupDB.formatDate(yesterday);
        const yesterdayTotal = pushupDB.getTodayTotal(yesterdayStr);

        if (yesterdayTotal < 20 && yesterdayTotal > 0) {
            this.showNotification('Goal Missed', {
                body: `You only did ${yesterdayTotal} pushups yesterday. Let's do better today!`,
                icon: '../icons/icon-192.svg'
            });
        }
    }
}

// Initialize notification manager when DOM is ready
const notificationManager = new NotificationManager();
document.addEventListener('DOMContentLoaded', () => {
    notificationManager.init();
    notificationManager.scheduleMidnightCheck();
});

