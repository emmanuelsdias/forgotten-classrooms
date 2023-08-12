// Function to handle checkbox changes
function handleCheckboxChange(roomId, isChecked) {
  // Retrieve hidden room IDs from local storage
  browser.storage.local.get(['hiddenRoomsIds'], result => {
    const hiddenRoomsIds = result.hiddenRoomsIds || [];
    if (isChecked) {
      // Add room ID to hiddenRoomsIds
      hiddenRoomsIds.push(roomId);
    } else {
      // Remove room ID from hiddenRoomsIds
      const index = hiddenRoomsIds.indexOf(roomId);
      if (index !== -1) {
        hiddenRoomsIds.splice(index, 1);
      }
    }
    // Update hiddenRoomsIds in local storage
    browser.storage.local.set({ hiddenRoomsIds });
    // Notify content script to refresh hidden rooms
    browser.tabs.query({
      active: true,
      currentWindow: true
    }, tabs => {
      const activeTab = tabs[0];
      browser.tabs.sendMessage(activeTab.id, {
        from: 'popup',
        subject: 'refreshHiddenRooms'
      });
    });
  });
}

// Function to add a row with a checkbox to the popup
function addRowWithCheckbox(roomId, roomName, isHidden) {
  // Create a new row element
  const dynamicList = document.getElementById("dynamicList");
  const row = document.createElement("div");
  row.classList.add("row");

  // Create an input element for the checkbox
  const switchInput = document.createElement("input");
  switchInput.classList.add("switch");
  switchInput.type = "checkbox";
  switchInput.checked = isHidden;

  // Create a label element for the room name
  const label = document.createElement("span");
  label.classList.add("label");
  label.textContent = roomName;

  // Append the checkbox and label to the row
  row.appendChild(switchInput);
  row.appendChild(label);

  // Append the row to the dynamic list
  dynamicList.appendChild(row);

  // Add an event listener to the checkbox
  switchInput.addEventListener("change", function () {
    // Call handleCheckboxChange with the room ID and checkbox state
    handleCheckboxChange(roomId, this.checked);
  });
}

// Function to display rooms in the popup
const displayRooms = roomsInfo => {
  for (const roomId in roomsInfo) {
    // Add a row with a checkbox for each room
    addRowWithCheckbox(roomId, roomsInfo[roomId]['name'], roomsInfo[roomId]['isHidden']);
  }
};

// Event listener for when the DOM is ready
window.addEventListener('DOMContentLoaded', () => {
  // Query for the active tab and send a message to request room information
  browser.tabs.query({ active: true, currentWindow: true }, tabs => {
    browser.tabs.sendMessage(
      tabs[0].id,
      { from: 'popup', subject: 'requestRoomsInfo' },
      // Call displayRooms when the room information is received
      displayRooms
    );
  });
});