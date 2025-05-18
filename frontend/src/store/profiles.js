// store/profiles.js
import { csrfFetch } from "./csrf";
// Action Type
const SET_PROFILES = 'profiles/SET_PROFILES';
const UPDATE_PROFILE = "profiles/UPDATE_PROFILE";

// Action Creator
export const setProfiles = (profiles) => ({
  type: SET_PROFILES,
  profiles,
});

export const updateProfile = (profile) => ({
  type: UPDATE_PROFILE,
  profile,
});


// Thunk Action for fetching profiles from the backend API
export const fetchProfiles = () => async (dispatch) => {
  const res = await fetch('/api/profiles');
  if (res.ok) {
    const data = await res.json();
    // Assuming your backend returns { profiles: [...] }
    dispatch(setProfiles(data.profiles));
  }
};

//  Thunk for updating profile 
export const editProfile = (profileData) => async (dispatch) => {
  const res = await csrfFetch("/api/profiles/profile", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(profileData),
  });

  if (res.ok) {
    const data = await res.json();
    dispatch(updateProfile(data.user));
    return data.user; // Return updated profile for frontend use
  } else {
    const errorData = await res.json();
    throw new Error(errorData.message || "Failed to update profile");
  }
};

const initialState = {
  list: [] // we'll store profiles here
};

const profilesReducer = (state = initialState, action) => {
  switch (action.type) {
    case SET_PROFILES:
      return { ...state, list: action.profiles };
    case UPDATE_PROFILE:
      return {
        ...state,
        list: state.list.map((profile) =>
          profile.id === action.profile.id ? action.profile : profile
        ),
      }
    default:
      return state;
  }
};

export default profilesReducer;
