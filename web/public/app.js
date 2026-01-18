const map = new maplibregl.Map({
  container: "map",
  style: "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json",
  center: [34.886, 32.089],
  zoom: 12.6,
});

map.addControl(new maplibregl.NavigationControl({ showCompass: false }));

const listEl = document.getElementById("park-list");
const detailEl = document.getElementById("park-detail");
const searchInput = document.getElementById("search");
const locateBtn = document.getElementById("locate");
const filterChips = Array.from(document.querySelectorAll(".chip"));
let parkData = [];
let markers = [];
let selectedId = null;
const activeFilters = {
  ageTags: new Set(),
  amenities: new Set(),
  parkingPaid: null,
};

function clearMarkers() {
  markers.forEach((marker) => marker.remove());
  markers = [];
}

function renderList(parks) {
  listEl.innerHTML = "";
  if (!parks.length) {
    listEl.innerHTML = "<p>No parks match this search.</p>";
    return;
  }

  parks.forEach((park) => {
    const card = document.createElement("div");
    card.className = "park-card";
    const ageTags = park.ageTags && park.ageTags.length ? park.ageTags : ["All ages"];
    const amenities = park.amenities && park.amenities.length ? park.amenities : ["Amenities TBD"];
    const category = park.category || "green space";
    const parkingLabel = park.parking?.paid === false ? "Free parking" : "Parking TBD";
    const parkingType = park.parking?.type && park.parking.type !== "unknown" ? park.parking.type : "Type TBD";
    card.innerHTML = `
      <h3>${park.name}</h3>
      <div class="park-meta">
        <span class="badge">${category}</span>
        <span>${ageTags.join(" • ")}</span>
        <span>${amenities.slice(0, 2).join(" · ")}</span>
        <span>${parkingLabel} · ${parkingType}</span>
      </div>
    `;
    card.addEventListener("click", () => {
      selectPark(park);
    });
    listEl.appendChild(card);
  });
}

function renderMarkers(parks) {
  clearMarkers();
  parks.forEach((park) => {
    const el = document.createElement("div");
    el.style.width = "14px";
    el.style.height = "14px";
    el.style.background = "#f2b705";
    el.style.border = "2px solid #2d5f3b";
    el.style.borderRadius = "50%";
    const marker = new maplibregl.Marker(el)
      .setLngLat([park.lng, park.lat])
      .setPopup(
        new maplibregl.Popup({ offset: 16 }).setHTML(
          `<strong>${park.name}</strong><br/>${park.address}`
        )
      )
      .addTo(map);
    marker.getElement().addEventListener("click", () => {
      selectPark(park);
    });
    markers.push(marker);
  });
}

function renderDetail(park) {
  if (!park) {
    detailEl.innerHTML = "<h3>Select a park</h3><p>Click a card or marker to see details here.</p>";
    return;
  }

  const ageTags = park.ageTags && park.ageTags.length ? park.ageTags : ["All ages"];
  const amenities = park.amenities && park.amenities.length ? park.amenities : ["Amenities TBD"];
  const parking = park.parking || {};
  const parkingLabel = parking.paid === false ? "Free parking" : "Parking TBD";
  const parkingType = parking.type && parking.type !== "unknown" ? parking.type : "Type TBD";
  const walkMins =
    typeof parking.walkMins === "number" ? `${parking.walkMins} min walk` : "Walk time TBD";
  const category = park.category || "green space";

  detailEl.innerHTML = `
    <div class="detail-header">
      <div>
        <p class="kicker">Park profile</p>
        <h3>${park.name}</h3>
        <p>${park.address || "Petah Tikva"}</p>
      </div>
      <button class="primary">Save</button>
    </div>
    <div class="meta-line">
      <span>${category}</span>
      <span>${parkingLabel}</span>
      <span>${parkingType}</span>
      <span>${walkMins}</span>
    </div>
    <p class="kicker">Age fit</p>
    <div class="meta-line">
      ${ageTags.map((tag) => `<span>${tag}</span>`).join("")}
    </div>
    <p class="kicker">Amenities</p>
    <div class="meta-line">
      ${amenities.map((tag) => `<span>${tag}</span>`).join("")}
    </div>
    <p class="kicker">Community</p>
    <div class="meta-line">
      <span>Tips coming soon</span>
      <span>Last update: TBD</span>
    </div>
    <div class="detail-actions">
      <button class="ghost">Add tip</button>
      <button class="ghost">Report parking</button>
    </div>
  `;
}

function selectPark(park) {
  selectedId = park.id;
  map.flyTo({ center: [park.lng, park.lat], zoom: 14 });
  renderDetail(park);
}

function normalizeTerm(value) {
  return value.toLowerCase().replace(/[^a-z0-9\\s-]/g, "").trim();
}

function fuzzyMatch(term, text) {
  if (!term) {
    return true;
  }
  if (text.includes(term)) {
    return true;
  }
  if (term.length < 4 || text.length < 4) {
    return false;
  }
  // Lightweight fuzzy match: allow small edit distance on short terms.
  const maxEdits = term.length <= 5 ? 1 : 2;
  let edits = 0;
  let i = 0;
  let j = 0;
  while (i < term.length && j < text.length) {
    if (term[i] === text[j]) {
      i += 1;
      j += 1;
    } else {
      edits += 1;
      if (edits > maxEdits) {
        return false;
      }
      if (term.length > text.length) {
        i += 1;
      } else if (text.length > term.length) {
        j += 1;
      } else {
        i += 1;
        j += 1;
      }
    }
  }
  return edits <= maxEdits;
}

function matchesSearch(park, term) {
  if (!term) {
    return true;
  }
  const name = normalizeTerm(park.name || "");
  const category = normalizeTerm(park.category || "");
  const address = normalizeTerm(park.address || "");
  if (name.includes(term) || category.includes(term) || address.includes(term)) {
    return true;
  }

  const haystack = `${name} ${category} ${address}`;
  return fuzzyMatch(term, haystack);
}

function applySearch() {
  const term = normalizeTerm(searchInput.value);
  const filtered = parkData.filter((park) => {
    const matchesTerm = matchesSearch(park, term);
    if (!matchesTerm) {
      return false;
    }

    if (activeFilters.ageTags.size) {
      const tags = park.ageTags || [];
      const hasAge = tags.some((tag) => activeFilters.ageTags.has(tag));
      if (!hasAge) {
        return false;
      }
    }

    if (activeFilters.amenities.size) {
      const amenities = park.amenities || [];
      const hasAmenity = amenities.some((item) => activeFilters.amenities.has(item));
      if (!hasAmenity) {
        return false;
      }
    }

    if (activeFilters.parkingPaid !== null) {
      if (park.parking?.paid !== activeFilters.parkingPaid) {
        return false;
      }
    }

    return true;
  });
  renderList(filtered);
  renderMarkers(filtered);
  if (selectedId) {
    const selected = filtered.find((park) => park.id === selectedId);
    renderDetail(selected || null);
  }
}

fetch("./data/parks.json")
  .then((res) => res.json())
  .then((data) => {
    parkData = data.parks || [];
    renderList(parkData);
    renderMarkers(parkData);
    if (parkData.length) {
      renderDetail(parkData[0]);
      selectedId = parkData[0].id;
    }
  })
  .catch(() => {
    listEl.innerHTML = "<p>Unable to load park data.</p>";
  });

searchInput.addEventListener("input", applySearch);

filterChips.forEach((chip) => {
  chip.addEventListener("click", () => {
    const type = chip.dataset.filterType;
    const value = chip.dataset.filterValue;
    if (type === "clear") {
      activeFilters.ageTags.clear();
      activeFilters.amenities.clear();
      activeFilters.parkingPaid = null;
      filterChips.forEach((item) => item.classList.remove("active"));
      applySearch();
      return;
    }

    chip.classList.toggle("active");

    if (type === "age") {
      if (chip.classList.contains("active")) {
        activeFilters.ageTags.add(value);
      } else {
        activeFilters.ageTags.delete(value);
      }
    }

    if (type === "amenity") {
      if (chip.classList.contains("active")) {
        activeFilters.amenities.add(value);
      } else {
        activeFilters.amenities.delete(value);
      }
    }

    if (type === "parking") {
      const wantsFree = value === "free";
      if (chip.classList.contains("active")) {
        activeFilters.parkingPaid = !wantsFree;
        filterChips
          .filter((item) => item.dataset.filterType === "parking" && item !== chip)
          .forEach((item) => item.classList.remove("active"));
      } else {
        activeFilters.parkingPaid = null;
      }
    }

    applySearch();
  });
});

locateBtn.addEventListener("click", () => {
  if (!navigator.geolocation) {
    return;
  }
  navigator.geolocation.getCurrentPosition((pos) => {
    const { latitude, longitude } = pos.coords;
    map.flyTo({ center: [longitude, latitude], zoom: 13.5 });
  });
});
