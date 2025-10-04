const AppView = (() => {
  let currentView = "tree";
  let treeContainer = null;
  let mapContainer = null;
  let viewButtons = [];

  const init = () => {
    treeContainer = document.getElementById("orgchart");
    mapContainer = document.getElementById("mapView");
    viewButtons = Array.from(document.querySelectorAll(".view-button"));

    if (!treeContainer || !mapContainer || viewButtons.length === 0) {
      return;
    }

    viewButtons.forEach((button) => {
      button.addEventListener("click", () => {
        const targetView = button.dataset.view;
        if (!targetView || targetView === currentView) {
          return;
        }
        setView(targetView);
      });
    });

    setView(currentView);
  };

  const setView = (view) => {
    currentView = view === "map" ? "map" : "tree";
    viewButtons.forEach((button) => {
      const isActive = button.dataset.view === currentView;
      button.classList.toggle("active", isActive);
      button.setAttribute("aria-pressed", String(isActive));
    });

    if (currentView === "map") {
      treeContainer.classList.add("hidden");
      mapContainer.classList.remove("hidden");
      if (typeof OrgMap !== "undefined" && OrgMap && typeof OrgMap.show === "function") {
        OrgMap.show();
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
