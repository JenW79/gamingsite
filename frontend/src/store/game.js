// store/game.js

// Action Types
const SET_GAME_DATA = "game/SET_GAME_DATA";
const UPDATE_STATS = "game/UPDATE_STATS";
const UPDATE_INVENTORY = "game/UPDATE_INVENTORY";

// Action Creators
export const setGameData = (gameData) => ({
  type: SET_GAME_DATA,
  gameData,
});

export const updateStats = (stats) => ({
  type: UPDATE_STATS,
  stats,
});

export const updateInventory = (inventory) => ({
  type: UPDATE_INVENTORY,
  inventory,
});

// Thunk to Fetch Player Game Data from Backend
export const fetchGameData = (userId) => async (dispatch) => {
  const res = await fetch(`/api/game/${userId}`);
  if (res.ok) {
    const data = await res.json();
    dispatch(setGameData(data));
  }
};

const initialState = {
  stats: {
    health: 100,
    attack: 10,
    defense: 5,
    energy: 100,
  },
  inventory: [],
};

const gameReducer = (state = initialState, action) => {
  switch (action.type) {
    case SET_GAME_DATA:
      return { ...state, ...action.gameData };
    case UPDATE_STATS:
      return { ...state, stats: { ...state.stats, ...action.stats } };
    case UPDATE_INVENTORY:
      return { ...state, inventory: action.inventory };
    default:
      return state;
  }
};

export default gameReducer;
