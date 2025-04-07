// favorites.js

export function renderFavorites(favorites) {
    const favoritesDiv = document.getElementById('favorites');
    const searchInput = document.getElementById('favoriteSearch');
    if (!favoritesDiv) return;

    let filtered = favorites;

    if (searchInput && searchInput.value.trim() !== "") {
        const query = searchInput.value.trim().toLowerCase();
        filtered = favorites.filter(fav => fav.name.toLowerCase().includes(query));
    }

    filtered.sort((a, b) => a.name.localeCompare(b.name));

    favoritesDiv.innerHTML = filtered.map((fav, i) => `
      <div class="favorite-item">
        <div class="favorite-content">
          <span class="favorite-name" onclick="window.goToFavorite(${fav.lat}, ${fav.lng})">
            ${fav.name}
          </span>
          <div class="favorite-actions">
            <button class="edit-btn" onclick="window.editFavorite(${i})">✏️</button>
            <button class="delete-btn" onclick="window.deleteFavorite(${i})">❌</button>
          </div>
        </div>
      </div>
    `).join('');
}

export async function pinCurrentLocation(selectedLocation, currentFavorites, renderFavorites) {
    if (!selectedLocation) {
        alert("Please click on the map to select a location first!");
        return;
    }

    const { value: name } = await Swal.fire({
        title: 'Enter a name for this location',
        input: 'text',
        inputPlaceholder: 'Favorite location name',
        showCancelButton: true
    });

    if (name) {
        const fav = { name, lat: selectedLocation.lat, lng: selectedLocation.lng };
        currentFavorites.push(fav);
        try {
            await window.api.saveFavorites(currentFavorites);
            renderFavorites(currentFavorites);
        } catch (err) {
            console.error('Error saving favorites:', err);
        }
    }
}

export async function editFavorite(index, currentFavorites, renderFavorites) {
    const fav = currentFavorites[index];
    const { value: newName } = await Swal.fire({
        title: 'Edit Favorite',
        input: 'text',
        inputValue: fav.name,
        showCancelButton: true,
        inputPlaceholder: 'Enter new name'
    });

    if (newName && newName !== fav.name) {
        currentFavorites[index].name = newName;
        try {
            await window.api.saveFavorites(currentFavorites);
            renderFavorites(currentFavorites);
        } catch (err) {
            console.error('Error saving favorites:', err);
        }
    }
}

export function deleteFavorite(index, currentFavorites, renderFavorites) {
    currentFavorites.splice(index, 1);
    window.api.saveFavorites(currentFavorites)
        .then(() => renderFavorites(currentFavorites))
        .catch(err => console.error('Error saving favorites:', err));
}