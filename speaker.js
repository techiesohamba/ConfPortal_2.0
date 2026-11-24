// Route Guard: Ensure current session exists and user has 'speaker' role
const sessionUser = getSessionUser();
if (!sessionUser || sessionUser.role !== "speaker") {
  alert("Access restricted. Speaker account required.");
  window.location.href = "auth.html";
} else {
  document.getElementById("speaker-name").textContent = sessionUser.name;
  document.getElementById("welcome-title").textContent = `Welcome, ${sessionUser.name}`;
}

// Render Assigned Talks
function renderSpeakerTalks() {
  const db = getDB();
  const container = document.getElementById("talks-container");

  // Filter conferences where this speaker is assigned
  const myTalks = db.conferences.filter((c) => c.speakerId === sessionUser.id);

  container.innerHTML = "";

  if (myTalks.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 3rem; background: white; border-radius: 8px; border: 1px solid #e2e8f0; color: #94a3b8;">
        <h3>No Assigned Talks Found</h3>
        <p style="margin-top: 0.5rem; font-size: 0.9rem;">You have not been assigned to any conferences yet. Contact the organizer to schedule your session.</p>
      </div>
    `;
    return;
  }

  myTalks.forEach((talk) => {
    // Calculate confirmed bookings
    const bookingsCount = db.bookings.filter((b) => b.conferenceId === talk.id).length;

    let badgeClass = "badge-upcoming";
    if (talk.status === "Completed") badgeClass = "badge-completed";
    if (talk.status === "Cancelled") badgeClass = "badge-cancelled";

    const card = document.createElement("div");
    card.className = "talk-card";

    card.innerHTML = `
      <div class="talk-header">
        <h3 class="talk-title">${talk.title}</h3>
        <span class="badge ${badgeClass}">${talk.status}</span>
      </div>

      <div class="talk-details">
        <div class="detail-item">
          Date & Time
          <strong>${talk.date} &bull; ${talk.time}</strong>
        </div>
        <div class="detail-item">
          Assigned Venue
          <strong>${talk.venue}</strong>
        </div>
        <div class="detail-item">
          Confirmed Attendees
          <strong>${bookingsCount} / ${talk.capacity} Registered</strong>
        </div>
      </div>

      <div class="resource-box">
        <label for="slide-url-${talk.id}">Presentation Slides / Material Link (Drive, GitHub, or PDF)</label>
        <div class="resource-input-group">
          <input 
            type="url" 
            id="slide-url-${talk.id}" 
            class="resource-input" 
            placeholder="https://drive.google.com/..." 
            value="${talk.slidesUrl || ""}"
          />
          <button class="btn-save" onclick="saveResourceLink(${talk.id})">Save Link</button>
        </div>
        <p id="msg-${talk.id}" class="status-msg">Resource link updated! It is now accessible to attendees.</p>
      </div>
    `;

    container.appendChild(card);
  });
}

// Update Slide URL in database
window.saveResourceLink = function (confId) {
  const input = document.getElementById(`slide-url-${confId}`);
  const msg = document.getElementById(`msg-${confId}`);
  const urlValue = input.value.trim();

  const db = getDB();
  const confIndex = db.conferences.findIndex((c) => c.id === confId);

  if (confIndex !== -1) {
    db.conferences[confIndex].slidesUrl = urlValue;
    saveDB(db);
  sendNotification(
  "New Presentation Material Available",
  `${sessionUser.name} uploaded new slides/notes for the session.`
);  

    msg.style.display = "block";
    setTimeout(() => {
      msg.style.display = "none";
    }, 3000);
  }
};

document.addEventListener("DOMContentLoaded", renderSpeakerTalks);