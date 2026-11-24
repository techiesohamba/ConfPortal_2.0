// Route Guard: Ensure current session exists and role is admin
const sessionUser = getSessionUser();
if (!sessionUser || sessionUser.role !== "admin") {
  alert("Access denied. Admin access only.");
  window.location.href = "auth.html";
} else {
  document.getElementById("admin-greeting").textContent = `Welcome, ${sessionUser.name}`;
}

const modal = document.getElementById("conference-modal");
const conferenceForm = document.getElementById("conference-form");
const speakerSelect = document.getElementById("conf-speaker");

// Initialize and render page elements
document.addEventListener("DOMContentLoaded", () => {
  populateSpeakerOptions();
  renderDashboard();
});

// Populate Speaker dropdown dynamically with registered speakers
function populateSpeakerOptions() {
  const db = getDB();
  const speakers = db.users.filter((u) => u.role === "speaker");
  speakerSelect.innerHTML = "";

  if (speakers.length === 0) {
    const opt = document.createElement("option");
    opt.value = "";
    opt.textContent = "No speakers found";
    speakerSelect.appendChild(opt);
    return;
  }

  speakers.forEach((spk) => {
    const option = document.createElement("option");
    option.value = spk.id;
    option.textContent = `${spk.name} (${spk.email})`;
    speakerSelect.appendChild(option);
  });
}

// Render stat metrics and conference records
function renderDashboard() {
  const db = getDB();

  // Update Stat Cards
  document.getElementById("stat-total-conf").textContent = db.conferences.length;
  document.getElementById("stat-total-bookings").textContent = db.bookings.length;
  document.getElementById("stat-total-speakers").textContent = db.users.filter(
    (u) => u.role === "speaker"
  ).length;

  // Render Table
  const tbody = document.getElementById("conference-table-body");
  tbody.innerHTML = "";

  if (db.conferences.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: #9ca3af; padding: 2rem;">No conferences found. Click "+ Add Conference" to create one.</td></tr>`;
    return;
  }

  db.conferences.forEach((conf) => {
    const bookingCount = db.bookings.filter((b) => b.conferenceId === conf.id).length;
    const tr = document.createElement("tr");

    let badgeClass = "badge-upcoming";
    if (conf.status === "Completed") badgeClass = "badge-completed";
    if (conf.status === "Cancelled") badgeClass = "badge-cancelled";

    tr.innerHTML = `
      <td><strong>${conf.title}</strong></td>
      <td>${conf.date}<br><small style="color: #6b7280;">${conf.time}</small></td>
      <td>${conf.venue}</td>
      <td>${conf.speakerName || "Unassigned"}</td>
      <td>${bookingCount} / ${conf.capacity}</td>
      <td><span class="badge ${badgeClass}">${conf.status}</span></td>
      <td>
        <button class="action-btn edit-btn" onclick="editConference(${conf.id})">Edit</button>
        <button class="action-btn delete-btn" onclick="deleteConference(${conf.id})">Delete</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

// Modal open/close helpers
function openModal(isEdit = false) {
  modal.style.display = "flex";
  if (!isEdit) {
    document.getElementById("modal-title").textContent = "Schedule New Conference";
    conferenceForm.reset();
    document.getElementById("conf-id").value = "";
  }
}

function closeModal() {
  modal.style.display = "none";
}

// Create or Update Conference Handler
conferenceForm.addEventListener("submit", function (e) {
  e.preventDefault();

  const idField = document.getElementById("conf-id").value;
  const title = document.getElementById("conf-title").value.trim();
  const date = document.getElementById("conf-date").value;
  const time = document.getElementById("conf-time").value.trim();
  const venue = document.getElementById("conf-venue").value.trim();
  const capacity = parseInt(document.getElementById("conf-capacity").value, 10);
  const speakerId = parseInt(document.getElementById("conf-speaker").value, 10);
  const status = document.getElementById("conf-status").value;

  const db = getDB();
  const speakerObj = db.users.find((u) => u.id === speakerId);
  const speakerName = speakerObj ? speakerObj.name : "Unassigned";

  if (idField) {
    // Edit existing conference
    const confIndex = db.conferences.findIndex((c) => c.id === parseInt(idField, 10));
    if (confIndex !== -1) {
      db.conferences[confIndex] = {
        ...db.conferences[confIndex],
        title,
        date,
        time,
        venue,
        capacity,
        speakerId,
        speakerName,
        status
      };
    }
  } else {
    // Create new conference
    const newConf = {
      id: Date.now(),
      title,
      date,
      time,
      venue,
      capacity,
      speakerId,
      speakerName,
      status,
      slidesUrl: ""
    };
    db.conferences.push(newConf);
  }

  saveDB(db);
  closeModal();
  renderDashboard();
});

// Edit Button Action
window.editConference = function (id) {
  const db = getDB();
  const conf = db.conferences.find((c) => c.id === id);
  if (!conf) return;

  document.getElementById("conf-id").value = conf.id;
  document.getElementById("conf-title").value = conf.title;
  document.getElementById("conf-date").value = conf.date;
  document.getElementById("conf-time").value = conf.time;
  document.getElementById("conf-venue").value = conf.venue;
  document.getElementById("conf-capacity").value = conf.capacity;
  document.getElementById("conf-speaker").value = conf.speakerId;
  document.getElementById("conf-status").value = conf.status;

  document.getElementById("modal-title").textContent = "Edit Conference Details";
  openModal(true);
};

// Delete Button Action
window.deleteConference = function (id) {
  if (!confirm("Are you sure you want to delete this conference? All related bookings will also be removed.")) {
    return;
  }

  const db = getDB();
  db.conferences = db.conferences.filter((c) => c.id !== id);
  // Remove related bookings
  db.bookings = db.bookings.filter((b) => b.conferenceId !== id);

  saveDB(db);
  renderDashboard();
};