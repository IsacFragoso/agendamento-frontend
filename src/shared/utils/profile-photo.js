export const PROFILE_PHOTO_PLACEHOLDER = `${import.meta.env.BASE_URL}images/user-placeholder.jpg`;

export const handleProfilePhotoError = (event) => {
  event.currentTarget.onerror = null;
  event.currentTarget.src = PROFILE_PHOTO_PLACEHOLDER;
};
