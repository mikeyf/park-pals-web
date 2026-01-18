const STORAGE_KEYS = {
  parks: "parkPalsUserParks",
  updates: "parkPalsUpdates",
  reviews: "parkPalsReviews",
};

const newParkForm = document.getElementById("new-park-form");
const updateForm = document.getElementById("update-park-form");
const parkSelect = document.getElementById("park-select");
const updatesList = document.getElementById("updates-list");
const reviewsList = document.getElementById("reviews-list");

function loadData(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) || fallback;
  } catch (err) {
    return fallback;
  }
}

function saveData(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function parseCoordinates(value) {
  const parts = value.split(",").map((item) => Number(item.trim()));
  if (parts.length !== 2 || parts.some((num) => Number.isNaN(num))) {
    return null;
  }
  return { lat: parts[0], lng: parts[1] };
}

function parseAgeRange(value) {
  const parts = value.split("-").map((item) => Number(item.trim()));
  if (parts.length !== 2 || parts.some((num) => Number.isNaN(num))) {
    return ["All ages"];
  }
  return [`${parts[0]}-${parts[1]}`];
}

function parseAmenities(value) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseParking(value) {
  const lower = value.toLowerCase();
  return {
    type: lower.includes("lot") ? "lot" : "street",
    paid: lower.includes("free") ? false : lower.includes("paid") ? true : null,
    walkMins: null,
    availability: "unknown",
  };
}

function addOption(option) {
  parkSelect.appendChild(option);
}

function renderLists() {
  const updates = loadData(STORAGE_KEYS.updates, []);
  const reviews = loadData(STORAGE_KEYS.reviews, []);
  updatesList.innerHTML = updates.length
    ? updates.map((item) => `<div class="tip-card"><p><strong>${item.park}:</strong> ${item.note}</p></div>`).join("")
    : "<p>No updates yet.</p>";
  reviewsList.innerHTML = reviews.length
    ? reviews.map((item) => `<div class="tip-card"><p><strong>${item.park}:</strong> ${item.review}</p></div>`).join("")
    : "<p>No reviews yet.</p>";
}

fetch("./data/parks.json")
  .then((res) => res.json())
  .then((data) => {
    const parks = data.parks || [];
    const userParks = loadData(STORAGE_KEYS.parks, []);
    const combined = parks.concat(userParks);
    combined
      .sort((a, b) => a.name.localeCompare(b.name))
      .forEach((park) => {
        const option = document.createElement("option");
        option.value = park.id;
        option.textContent = park.name;
        addOption(option);
      });
  });

newParkForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const formData = new FormData(newParkForm);
  const name = formData.get("name").trim();
  const address = formData.get("address").trim();
  const coords = parseCoordinates(formData.get("coords"));
  if (!name || !coords) {
    alert("Please add a name and valid coordinates (lat, lng).");
    return;
  }
  const park = {
    id: `user-${Date.now()}`,
    name,
    lat: coords.lat,
    lng: coords.lng,
    address: address || "Petah Tikva",
    ageTags: parseAgeRange(formData.get("ageRange")),
    amenities: parseAmenities(formData.get("amenities")),
    parking: parseParking(formData.get("parking")),
    category: "park",
  };
  const parks = loadData(STORAGE_KEYS.parks, []);
  parks.push(park);
  saveData(STORAGE_KEYS.parks, parks);
  const option = document.createElement("option");
  option.value = park.id;
  option.textContent = park.name;
  addOption(option);
  newParkForm.reset();
  renderLists();
  alert("New park saved locally. It will appear on the map.");
});

updateForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const formData = new FormData(updateForm);
  const parkId = formData.get("parkId");
  const note = formData.get("updateNote").trim();
  const availability = formData.get("availability");
  const review = formData.get("review").trim();
  const parkName = parkSelect.options[parkSelect.selectedIndex]?.textContent || "Park";

  if (note) {
    const updates = loadData(STORAGE_KEYS.updates, []);
    updates.unshift({ parkId, park: parkName, note, availability, date: new Date().toISOString() });
    saveData(STORAGE_KEYS.updates, updates);
  }

  if (review) {
    const reviews = loadData(STORAGE_KEYS.reviews, []);
    reviews.unshift({ parkId, park: parkName, review, date: new Date().toISOString() });
    saveData(STORAGE_KEYS.reviews, reviews);
  }

  updateForm.reset();
  renderLists();
  alert("Update saved locally. Thank you!");
});

renderLists();
