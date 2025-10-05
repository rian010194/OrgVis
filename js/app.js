const AppView = (() => {
  let currentView = "tree";
  let treeContainer = null;
  let mapContainer = null;
  let dropdownToggle = null;
  let dropdownMenu = null;
  let viewOptions = [];

  const init = () => {
    treeContainer = document.getElementById("orgchart");
    mapContainer = document.getElementById("mapView");
    dropdownToggle = document.getElementById("viewDropdownToggle");
    dropdownMenu = document.getElementById("viewDropdownMenu");
    viewOptions = Array.from(document.querySelectorAll(".view-option"));

    if (!treeContainer || !mapContainer || !dropdownToggle || !dropdownMenu || viewOptions.length === 0) {
      return;
    }

    // Toggle dropdown
    dropdownToggle.addEventListener("click", (e) => {
      e.stopPropagation();
      toggleDropdown();
    });

    // Handle view option clicks
    viewOptions.forEach((option) => {
      option.addEventListener("click", () => {
        const targetView = option.dataset.view;
        if (!targetView || targetView === currentView) {
          closeDropdown();
          return;
        }
        setView(targetView);
        closeDropdown();
      });
    });

    // Close dropdown when clicking outside
    document.addEventListener("click", (e) => {
      if (!dropdownToggle.contains(e.target) && !dropdownMenu.contains(e.target)) {
        closeDropdown();
      }
    });

    setView(currentView);
  };

  const setView = (view) => {
    currentView = view === "map" ? "map" : "tree";
    
    // Update view options
    viewOptions.forEach((option) => {
      const isActive = option.dataset.view === currentView;
      option.classList.toggle("active", isActive);
      option.setAttribute("aria-selected", String(isActive));
    });

    // Update dropdown toggle text
    const currentText = dropdownToggle.querySelector(".view-current");
    if (currentText) {
      currentText.textContent = currentView === "map" ? "Map View" : "Tree View";
    }

    if (currentView === "map") {
      treeContainer.classList.add("hidden");
      mapContainer.classList.remove("hidden");
      if (typeof OrgMap !== "undefined" && OrgMap && typeof OrgMap.show === "function") {
        OrgMap.show();
        
        // Focus on the currently selected node when switching to map view
        if (typeof OrgUI !== "undefined" && OrgUI && typeof OrgUI.getSelectedNodeId === "function") {
          const selectedNodeId = OrgUI.getSelectedNodeId();
          if (selectedNodeId && typeof OrgMap.reveal === "function") {
            setTimeout(() => {
              OrgMap.reveal(selectedNodeId);
            }, 100);
          }
        }
      } else {
        // Visa felmeddelande om kartvyn inte är tillgänglig
        mapContainer.innerHTML = '<div style="padding: 2rem; text-align: center; color: #666;"><p>Kartvy är inte tillgänglig. D3.js kanske inte laddades korrekt.</p><p>Växla till trädvy för att se organisationsstrukturen.</p></div>';
      }
    } else {
      treeContainer.classList.remove("hidden");
      mapContainer.classList.add("hidden");
      if (typeof OrgMap !== "undefined" && OrgMap && typeof OrgMap.hide === "function") {
        OrgMap.hide();
      }
    }
  };

  const toggleDropdown = () => {
    const dropdown = dropdownToggle.closest(".view-dropdown");
    if (dropdown) {
      dropdown.classList.toggle("open");
      dropdownToggle.setAttribute("aria-expanded", dropdown.classList.contains("open"));
    }
  };

  const closeDropdown = () => {
    const dropdown = dropdownToggle.closest(".view-dropdown");
    if (dropdown) {
      dropdown.classList.remove("open");
      dropdownToggle.setAttribute("aria-expanded", "false");
    }
  };

  return {
    init,
    setView
  };
})();

document.addEventListener("DOMContentLoaded", async () => {
  const statusElement = document.getElementById("appStatus");
  if (statusElement) {
    statusElement.textContent = "Laddar organisationsdata...";
    statusElement.classList.remove("error");
  }

  try {
    await OrgStore.load();
    OrgUI.init();
    
    // Kontrollera om D3.js är tillgängligt innan vi initierar kartvyn
    if (typeof d3 !== "undefined") {
      OrgMap.init();
    } else {
      console.warn("D3.js är inte laddad. Kartvy kommer inte att fungera.");
    }
    
    AppView.init();
    if (statusElement) {
      statusElement.textContent = "";
    }
  } catch (error) {
    console.error("Kunde inte initiera applikationen", error);
    if (statusElement) {
      statusElement.textContent = "Kunde inte ladda data. Försök igen eller kontakta administratör.";
      statusElement.classList.add("error");
    }
  }
});
