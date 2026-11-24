// Storage keys
const DB_KEY = "conf_platform_db";
const SESSION_KEY = "conf_platform_session";

// Initial seed data
const initialSeed = {
  users: [
    { id: 1, name: "Admin Organizer", email: "admin@conf.com", password: "123", role: "admin" },
    { id: 2, name: "Dr. Roy", email: "roy@conf.com", password: "123", role: "speaker" },
    { id: 3, name: "Soham", email: "attendee@conf.com", password: "123", role: "attendee" }
  ],
  conferences: [
    {
      id: 101,
      title: "Tech Innovation & AI Summit",
      date: "2026-11-15",
      time: "10:00 AM",
      venue: "Main Auditorium Hall A",
      capacity: 50,
      speakerId: 2,
      speakerName: "Dr. Roy",
      status: "Upcoming",
      slidesUrl: "https://drive.google.com"
    }
  ],
  bookings: [
    { id: 1, userId: 3, conferenceId: 101, bookingDate: "2026-10-03", ticketCode: "CONF-A1B2C3" }
  ],
  notifications: [
    {
      id: 1,
      targetUserId: null, // null means broadcast to all users
      title: "Welcome to ConfPortal",
      message: "Check out the newly scheduled AI & Web summits for November.",
      timestamp: "Oct 3, 2026, 09:00 AM",
      readBy: []
    }
  ],
  communityMessages: [
    {
      id: 1,
      senderId: 1,
      senderName: "Admin Organizer",
      senderRole: "admin",
      conferenceId: 101,
      conferenceTitle: "Tech Innovation & AI Summit",
      message: "Welcome speakers! Please attach your presentation decks by November 10th.",
      timestamp: "Oct 3, 2026, 09:15 AM"
    }
  ]
};

// Seed database on first visit or update schema if keys are missing
function initStorage() {
  const existing = localStorage.getItem(DB_KEY);
  if (!existing) {
    localStorage.setItem(DB_KEY, JSON.stringify(initialSeed));
  } else {
    const parsed = JSON.parse(existing);
    let updated = false;
    if (!parsed.notifications) { parsed.notifications = initialSeed.notifications; updated = true; }
    if (!parsed.communityMessages) { parsed.communityMessages = initialSeed.communityMessages; updated = true; }
    if (updated) localStorage.setItem(DB_KEY, JSON.stringify(parsed));
  }
}

// Fetch entire database object
function getDB() {
  initStorage();
  return JSON.parse(localStorage.getItem(DB_KEY));
}

// Save updated database object
function saveDB(data) {
  localStorage.setItem(DB_KEY, JSON.stringify(data));
}

// Session Helpers
function setSessionUser(user) {
  const safeUser = { id: user.id, name: user.name, email: user.email, role: user.role };
  localStorage.setItem(SESSION_KEY, JSON.stringify(safeUser));
}

function getSessionUser() {
  const session = localStorage.getItem(SESSION_KEY);
  return session ? JSON.parse(session) : null;
}

function logoutUser() {
  localStorage.removeItem(SESSION_KEY);
  window.location.href = "auth.html";
}

// Notification Helper: Sends notification to a user or broadcasts to everyone (userId = null)
function sendNotification(title, message, targetUserId = null) {
  const db = getDB();
  const newNotif = {
    id: Date.now(),
    targetUserId: targetUserId,
    title: title,
    message: message,
    timestamp: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }),
    readBy: []
  };
  db.notifications.unshift(newNotif);
  saveDB(db);
}

// Run seed initialization
initStorage();