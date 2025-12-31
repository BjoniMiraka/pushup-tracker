// Database management using SQL.js
class PushupDatabase {
  constructor() {
    this.db = null;
    this.dbName = "pushup_tracker.db";
  }

  async init() {
    try {
      // Initialize SQL.js
      const SQL = await initSqlJs({
        locateFile: (file) =>
          `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.8.0/${file}`,
      });

      // Try to load existing database from localStorage
      const savedDb = localStorage.getItem(this.dbName);
      if (savedDb) {
        const uint8Array = new Uint8Array(JSON.parse(savedDb));
        this.db = new SQL.Database(uint8Array);
        console.log("Loaded existing database");
      } else {
        this.db = new SQL.Database();
        console.log("Created new database");
      }

      // Create table if it doesn't exist
      this.db.run(`
                CREATE TABLE IF NOT EXISTS pushups (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    date TEXT NOT NULL,
                    count INTEGER NOT NULL,
                    note TEXT,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `);

      // Create debt tracking table
      this.db.run(`
                CREATE TABLE IF NOT EXISTS debt (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    date TEXT NOT NULL,
                    reason TEXT NOT NULL,
                    amount INTEGER NOT NULL,
                    paid INTEGER DEFAULT 0,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `);

      // Create index on date for faster queries
      this.db.run(`
                CREATE INDEX IF NOT EXISTS idx_date ON pushups(date)
            `);

      this.db.run(`
                CREATE INDEX IF NOT EXISTS idx_debt_date ON debt(date)
            `);

      this.save();
      return true;
    } catch (error) {
      console.error("Database initialization error:", error);
      return false;
    }
  }

  save() {
    try {
      const data = this.db.export();
      const buffer = Array.from(data);
      localStorage.setItem(this.dbName, JSON.stringify(buffer));
    } catch (error) {
      console.error("Error saving database:", error);
    }
  }

  addPushup(date, count, note = "") {
    try {
      this.db.run("INSERT INTO pushups (date, count, note) VALUES (?, ?, ?)", [
        date,
        count,
        note,
      ]);
      this.save();
      return true;
    } catch (error) {
      console.error("Error adding pushup:", error);
      return false;
    }
  }

  updatePushup(id, date, count, note) {
    try {
      this.db.run(
        "UPDATE pushups SET date = ?, count = ?, note = ? WHERE id = ?",
        [date, count, note, id]
      );
      this.save();
      return true;
    } catch (error) {
      console.error("Error updating pushup:", error);
      return false;
    }
  }

  deletePushup(id) {
    try {
      this.db.run("DELETE FROM pushups WHERE id = ?", [id]);
      this.save();
      return true;
    } catch (error) {
      console.error("Error deleting pushup:", error);
      return false;
    }
  }

  getPushupsByDate(date) {
    try {
      const result = this.db.exec(
        "SELECT * FROM pushups WHERE date = ? ORDER BY created_at DESC",
        [date]
      );
      return this.formatResults(result);
    } catch (error) {
      console.error("Error getting pushups by date:", error);
      return [];
    }
  }

  getTodayTotal(date) {
    try {
      const result = this.db.exec(
        "SELECT SUM(count) as total FROM pushups WHERE date = ?",
        [date]
      );
      if (result.length > 0 && result[0].values.length > 0) {
        return result[0].values[0][0] || 0;
      }
      return 0;
    } catch (error) {
      console.error("Error getting today total:", error);
      return 0;
    }
  }

  getAllPushups() {
    try {
      const result = this.db.exec(
        "SELECT * FROM pushups ORDER BY date DESC, created_at DESC"
      );
      return this.formatResults(result);
    } catch (error) {
      console.error("Error getting all pushups:", error);
      return [];
    }
  }

  getDailyTotals() {
    try {
      const result = this.db.exec(`
                SELECT date, SUM(count) as total 
                FROM pushups 
                GROUP BY date 
                ORDER BY date DESC
            `);

      if (result.length === 0) return [];

      return result[0].values.map((row) => ({
        date: row[0],
        total: row[1],
      }));
    } catch (error) {
      console.error("Error getting daily totals:", error);
      return [];
    }
  }

  getStatistics() {
    try {
      const dailyTotals = this.getDailyTotals();

      // Total pushups
      const totalResult = this.db.exec(
        "SELECT SUM(count) as total FROM pushups"
      );
      const total = totalResult[0]?.values[0]?.[0] || 0;

      // Days with >= 20 pushups
      const daysCompleted = dailyTotals.filter((day) => day.total >= 20).length;

      // Average per day (only counting days with entries)
      const avgPerDay =
        dailyTotals.length > 0 ? Math.round(total / dailyTotals.length) : 0;

      // Current streak
      let streak = 0;
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      for (let i = 0; i < dailyTotals.length; i++) {
        const checkDate = new Date(today);
        checkDate.setDate(today.getDate() - i);
        const dateStr = this.formatDate(checkDate);

        const dayData = dailyTotals.find((d) => d.date === dateStr);
        if (dayData && dayData.total >= 20) {
          streak++;
        } else if (i > 0) {
          // If we miss a day (not today), break the streak
          break;
        }
      }

      return {
        total,
        daysCompleted,
        avgPerDay,
        streak,
      };
    } catch (error) {
      console.error("Error getting statistics:", error);
      return {
        total: 0,
        daysCompleted: 0,
        avgPerDay: 0,
        streak: 0,
      };
    }
  }

  formatResults(result) {
    if (result.length === 0) return [];

    const columns = result[0].columns;
    return result[0].values.map((row) => {
      const obj = {};
      columns.forEach((col, index) => {
        obj[col] = row[index];
      });
      return obj;
    });
  }

  formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  exportDatabase() {
    try {
      const data = this.db.export();
      const blob = new Blob([data], { type: "application/x-sqlite3" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `pushup_tracker_${this.formatDate(new Date())}.db`;
      a.click();
      URL.revokeObjectURL(url);
      return true;
    } catch (error) {
      console.error("Error exporting database:", error);
      return false;
    }
  }

  async importDatabase(file) {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);

      const SQL = await initSqlJs({
        locateFile: (file) =>
          `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.8.0/${file}`,
      });

      // Try to open the imported database
      const importedDb = new SQL.Database(uint8Array);

      // Verify it has the correct table structure
      const tables = importedDb.exec(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='pushups'"
      );
      if (tables.length === 0) {
        throw new Error("Invalid database file: missing pushups table");
      }

      // Replace current database
      this.db = importedDb;
      this.save();

      return true;
    } catch (error) {
      console.error("Error importing database:", error);
      return false;
    }
  }

  clearAllData() {
    try {
      this.db.run("DELETE FROM pushups");
      this.db.run("DELETE FROM debt");
      this.save();
      return true;
    } catch (error) {
      console.error("Error clearing data:", error);
      return false;
    }
  }

  // Debt management methods
  addDebt(date, reason, amount) {
    try {
      this.db.run(
        "INSERT INTO debt (date, reason, amount, paid) VALUES (?, ?, ?, 0)",
        [date, reason, amount]
      );
      this.save();
      return true;
    } catch (error) {
      console.error("Error adding debt:", error);
      return false;
    }
  }

  getUnpaidDebt() {
    try {
      const result = this.db.exec(
        "SELECT SUM(amount) as total FROM debt WHERE paid = 0"
      );
      if (result.length > 0 && result[0].values.length > 0) {
        return result[0].values[0][0] || 0;
      }
      return 0;
    } catch (error) {
      console.error("Error getting unpaid debt:", error);
      return 0;
    }
  }

  getAllDebt() {
    try {
      const result = this.db.exec(
        "SELECT * FROM debt ORDER BY date DESC, created_at DESC"
      );
      return this.formatResults(result);
    } catch (error) {
      console.error("Error getting all debt:", error);
      return [];
    }
  }

  markDebtAsPaid(id) {
    try {
      this.db.run("UPDATE debt SET paid = 1 WHERE id = ?", [id]);
      this.save();
      return true;
    } catch (error) {
      console.error("Error marking debt as paid:", error);
      return false;
    }
  }

  payOffDebt(amount) {
    try {
      // Get unpaid debts ordered by date (oldest first)
      const result = this.db.exec(
        "SELECT * FROM debt WHERE paid = 0 ORDER BY date ASC, created_at ASC"
      );

      if (result.length === 0 || result[0].values.length === 0) {
        return 0; // No debt to pay
      }

      let remainingAmount = amount;
      const debts = this.formatResults(result);

      for (const debt of debts) {
        if (remainingAmount <= 0) break;

        if (remainingAmount >= debt.amount) {
          // Can pay off this entire debt
          this.markDebtAsPaid(debt.id);
          remainingAmount -= debt.amount;
        } else {
          // Partially pay this debt (not implemented for simplicity)
          // For now, we only mark as paid if fully paid
          break;
        }
      }

      return amount - remainingAmount; // Return amount actually paid
    } catch (error) {
      console.error("Error paying off debt:", error);
      return 0;
    }
  }
}

// Create global database instance
const pushupDB = new PushupDatabase();
