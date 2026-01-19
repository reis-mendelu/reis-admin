
// state.js
// Shared application state

// We use a simple object to hold shared state
export const state = {
  userAssociation: null
};

// Helper to set association
export function setUserAssociation(data) {
  state.userAssociation = data;
}

// Helper to get association
export function getUserAssociation() {
  return state.userAssociation;
}
