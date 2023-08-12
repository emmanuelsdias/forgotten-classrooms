// Change the visibility of a classroom
function changeRoomVisibility(roomId, isHidden) {
  // Query for classroom elements with the given id
  // ...li[] selects classroom cards shown in home page
  // ...a[] selects classroom items in the left menu
  const roomElements = document.querySelectorAll(`li[data-course-id="${roomId}"], a[data-id="${roomId}"]`);
  roomElements.forEach((elem) => {
    elem.style.display = isHidden ? 'none' : '';
  });
}

// Return an array containing the ids from all classrooms which the user is currently hiding
async function getHiddenRoomsIds() {
  const result = await browser.storage.local.get(['hiddenRoomsIds']);
  if (result && result.hiddenRoomsIds && Array.isArray(result.hiddenRoomsIds)) {
    return result.hiddenRoomsIds;
  }
  return [];
}

// Return an array containing the ids from all classrooms retrieved from the current page
function getAllRoomsIds() {
  const rooms = document.querySelectorAll('div[role="section"] > [data-id]');
  const roomsIds = Array.from(rooms).map(room => room.getAttribute('data-id'));
  return roomsIds;
}

// Update the visibility of classrooms
async function updateRoomsVisibility() {
  const allIds = getAllRoomsIds();
  const hiddenIds = await getHiddenRoomsIds();
  const visibleIds = allIds.filter(id => !hiddenIds.includes(id));
  hiddenIds.forEach((id) => {
    changeRoomVisibility(id, true);
  });
  visibleIds.forEach((id) => {
    changeRoomVisibility(id, false);
  });
}

// Listener for messages from the popup
browser.runtime.onMessage.addListener((msg, sender, response) => {
  // Handle different message subjects from popup
  if (msg.from === 'popup') {
    // Get classrooms information when page action is clicked
    if (msg.subject === 'requestRoomsInfo') {
      const rooms = document.querySelectorAll('div[role="section"] > [data-id]');
      var roomsInfo = {};
      rooms.forEach((room) => {
        const id = room.getAttribute('data-id');
        const name = room.getAttribute('aria-label');
        const isHidden = room.getAttribute('style') === 'display: none;';
        roomsInfo[id] = { 'name': name, 'isHidden': isHidden };
      });
      // Respond with the classrooms' information
      response(roomsInfo);
    // Update rooms visibility whenever checkbox changes
    } else if (msg.subject === 'refreshHiddenRooms') {
      updateRoomsVisibility();
    }
  }
});

// Configure a MutationObserver to update visibility when the DOM changes
// This guarantees that content script runs after all classrooms are loaded
const config = { childList: true, subtree: true };
const observer = new MutationObserver((mutations, observer) => {
  updateRoomsVisibility();
});
observer.observe(document.body, config);
