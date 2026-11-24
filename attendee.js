// Render dynamic navbar depending on session state
function updateNavBar() {
  const user = getSessionUser();
  const navContainer = document.getElementById("nav-actions");

  if (!user) {
    navContainer.innerHTML = `
      <a href="auth.html" class="btn btn-primary">Sign In</a>
    `;
    return;
  }

  // Calculate unread notification count
  const db = getDB();
  const unreadCount = (db.notifications || []).filter(
    n => (n.targetUserId === null || n.targetUserId === user.id) &&
         (!n.readBy || !n.readBy.includes(user.id))
  ).length;

  let roleDashboardBtn = "";
  if (user.role === "admin") {
    roleDashboardBtn = `<a href="admin-dashboard.html" class="btn btn-outline">Admin Panel</a>`;
  } else if (user.role === "speaker") {
    roleDashboardBtn = `<a href="speaker-dashboard.html" class="btn btn-outline">Speaker Panel</a>`;
  } else {
    roleDashboardBtn = `<a href="attendee-dashboard.html" class="btn btn-outline">My Registrations</a>`;
  }

  navContainer.innerHTML = `
    <span style="font-size: 0.85rem; color: #475569;">Hi, <strong>${user.name}</strong></span>
    <a href="community.html" class="btn btn-outline">💬 Community</a>
    <a href="notifications.html" class="btn btn-outline">
      🔔 Alerts ${unreadCount > 0 ? `<span class="notif-badge">${unreadCount}</span>` : ""}
    </a>
    ${roleDashboardBtn}
    <button class="btn btn-outline" onclick="logoutUser()">Logout</button>
  `;
}

// Render Conferences matching current search and filters
function renderConferences() {
  const db = getDB();
  const user = getSessionUser();
  const grid = document.getElementById("conferences-grid");
  const searchQuery = document.getElementById("search-input").value.trim().toLowerCase();
  const statusFilter = document.getElementById("status-filter").value;

  // Filter conferences
  const filtered = db.conferences.filter((conf) => {
    const matchesSearch =
      conf.title.toLowerCase().includes(searchQuery) ||
      (conf.speakerName && conf.speakerName.toLowerCase().includes(searchQuery));

    const matchesStatus =
      statusFilter === "All" || conf.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  grid.innerHTML = "";

  if (filtered.length === 0) {
    grid.innerHTML = `<p style="grid-column: 1 / -1; text-align: center; color: #94a3b8; padding: 3rem;">No conferences match your filters.</p>`;
    return;
  }

  filtered.forEach((conf) => {
    const bookedCount = db.bookings.filter((b) => b.conferenceId === conf.id).length;
    const isFull = bookedCount >= conf.capacity;
    const percentFilled = Math.min(100, Math.round((bookedCount / conf.capacity) * 100));

    const alreadyBooked = user
      ? db.bookings.some((b) => b.conferenceId === conf.id && b.userId === user.id)
      : false;

    let badgeClass = "badge-upcoming";
    if (conf.status === "Completed") badgeClass = "badge-completed";
    if (conf.status === "Cancelled") badgeClass = "badge-cancelled";

    const card = document.createElement("div");
    card.className = "conf-card";

    let buttonMarkup = "";
    if (conf.status !== "Upcoming") {
      buttonMarkup = `<button class="btn btn-disabled btn-full" disabled>Event ${conf.status}</button>`;
    } else if (alreadyBooked) {
      buttonMarkup = `
        <button class="btn btn-danger btn-full" onclick="cancelRegistration(${conf.id})">
          Cancel My Registration
        </button>`;
    } else if (isFull) {
      buttonMarkup = `<button class="btn btn-disabled btn-full" disabled>Fully Booked</button>`;
    } else {
      buttonMarkup = `
        <button class="btn btn-primary btn-full" onclick="registerForConference(${conf.id})">
          Book a Seat
        </button>`;
    }

    const resourceLink = conf.slidesUrl
      ? `<div class="conf-meta" style="margin-top: 0.4rem;">
           📄 <a href="${conf.slidesUrl}" target="_blank" style="color: #2563eb; text-decoration: underline;">View Slides / Resources</a>
         </div>`
      : "";

    card.innerHTML = `
      <div>
        <div class="conf-header">
          <h2 class="conf-title">${conf.title}</h2>
          <span class="badge ${badgeClass}">${conf.status}</span>
        </div>
        <div class="conf-meta">🗓️ ${conf.date} &bull; ${conf.time}</div>
        <div class="conf-meta">📍 ${conf.venue}</div>
        <div class="conf-meta">🎤 Speaker: <strong>${conf.speakerName || "TBD"}</strong></div>
        ${resourceLink}
        
        <div class="capacity-bar-container">
          <div class="capacity-text">
            <span>Seats Filled</span>
            <span><strong>${bookedCount}</strong> / ${conf.capacity}</span>
          </div>
          <div class="capacity-track">
            <div class="capacity-fill ${isFull ? "full" : ""}" style="width: ${percentFilled}%;"></div>
          </div>
        </div>
      </div>
      <div>
        ${buttonMarkup}
      </div>
    `;

    grid.appendChild(card);
  });
}

// Book a seat for a conference
window.registerForConference = function (confId) {
  const user = getSessionUser();

  if (!user) {
    alert("Please sign in or create an account to book your seat.");
    window.location.href = "auth.html";
    return;
  }

  const db = getDB();
  const conf = db.conferences.find((c) => c.id === confId);

  // Validation: Check capacity
  const bookedCount = db.bookings.filter((b) => b.conferenceId === confId).length;
  if (bookedCount >= conf.capacity) {
    alert("Sorry, this conference has reached maximum capacity!");
    return;
  }

  // Validation: Check duplicate booking
  const alreadyBooked = db.bookings.some((b) => b.conferenceId === confId && b.userId === user.id);
  if (alreadyBooked) {
    alert("You are already registered for this conference.");
    return;
  }

  const ticketRef = "CONF-" + Math.random().toString(36).substring(2, 8).toUpperCase();

  const newBooking = {
    id: Date.now(),
    userId: user.id,
    conferenceId: confId,
    ticketCode: ticketRef,
    bookingDate: new Date().toISOString().split("T")[0]
  };

  db.bookings.push(newBooking);
  saveDB(db);

  // Send an automated notification to this user
  sendNotification(
    "Booking Confirmed",
    `Your registration for "${conf.title}" is confirmed. Pass ID: ${ticketRef}.`,
    user.id
  );

  // Display Confirmation Ticket Modal
  document.getElementById("ticket-event-name").textContent = conf.title;
  document.getElementById("ticket-code").textContent = ticketRef;
  document.getElementById("ticket-modal").style.display = "flex";

  renderConferences();
  updateNavBar();
};

// Cancel a booked registration
window.cancelRegistration = function (confId) {
  const user = getSessionUser();
  if (!user) return;

  if (!confirm("Are you sure you want to cancel your seat for this conference?")) {
    return;
  }

  const db = getDB();
  db.bookings = db.bookings.filter((b) => !(b.conferenceId === confId && b.userId === user.id));
  saveDB(db);

  renderConferences();
  updateNavBar();
};

function closeTicketModal() {
  document.getElementById("ticket-modal").style.display = "none";
}

// Event Listeners for real-time search & filter
document.getElementById("search-input").addEventListener("input", renderConferences);
document.getElementById("status-filter").addEventListener("change", renderConferences);

// Initial Load
document.addEventListener("DOMContentLoaded", () => {
  updateNavBar();
  renderConferences();
});