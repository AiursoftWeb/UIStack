import { getVariables } from "../modules/css-variables";

// Selector for the theme toggle button
const themeToggleSelector = ".js-theme-toggle";

// Name of the theme setting used in local storage
const bootstrapThemeSettingName = "bsTheme";
const sidebarThemeSettingName = "sidebarTheme";

// Key used to store theme setting in local storage
const localStorageKey = "appstack-config-theme";

// Retrieving the theme toggle button element
const themeToggle = document.querySelector(themeToggleSelector);

if(themeToggle) {
  // Adding click event listener to the theme toggle button
  themeToggle.addEventListener("click", function(event) {
      // Prevent the default link behavior
      event.preventDefault();

      // --- Existing logic to toggle theme locally ---
      const currentTheme = localStorage.getItem(localStorageKey);

      // Toggling between "dark" and "default" themes
      const newTheme = currentTheme === "dark" ? "default" : "dark";

      // Setting the new theme in the HTML dataset
      document.documentElement.dataset[bootstrapThemeSettingName] = newTheme;
      document.documentElement.dataset[sidebarThemeSettingName] = newTheme;

      // Saving the new theme setting to local storage
      localStorage.setItem(localStorageKey, newTheme);

      // Function to post the theme change to the server
      const syncThemeWithServer = async () => {
        const postUrl = themeToggle.dataset.whenChangedPost;
        
        // Proceed only if the data attribute exists
        if (postUrl) {
          // The API expects 'light' or 'dark', but the code uses 'default'.
          // We convert 'default' to 'light' for the API call.
          const apiThemeValue = newTheme === "dark" ? "dark" : "light";

          try {
            const response = await fetch(postUrl, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                // Add other headers like CSRF tokens if required by your backend
              },
              body: JSON.stringify({ theme: apiThemeValue })
            });

            if (!response.ok) {
              console.error("Server responded with an error:", response.statusText);
            } else {
              console.log("Theme preference successfully synced with the server.");
            }
          } catch (error) {
            console.error("Failed to send theme preference to the server:", error);
          }
        }
      };

      // Call the function to sync the theme
      syncThemeWithServer();
      // --- MODIFICATION END ---


      window.cssVariables = getVariables();
      
      // Dispatching a custom event to re-render components
      window.document.dispatchEvent(new Event("DOMContentLoaded", {
        bubbles: true,
        cancelable: true
      }));
  });
}