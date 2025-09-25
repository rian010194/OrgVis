// workflow.js

// --- Global state ---
window.workflowEditor = null;

// --- Initiera workflow-editor ---
window.initWorkflow = function() {
  console.log("Initierar workflow...");
  const container = document.getElementById("drawflow");
  if (!container) return console.warn("Drawflow-container saknas.");

  // Skapa editor om den inte finns
  if (!window.workflowEditor) {
    window.workflowEditor = new Drawflow(container);
    window.workflowEditor.start();
    console.log("Ny Drawflow-editor skapad.");
  } else {
    // Rensa gamla noder & kopplingar
    window.workflowEditor.clear();
    console.log("Gamla noder rensade.");
  }

  const editor = window.workflowEditor;

  // --- Skapa noder ---
const triggerId = editor.addNode(
  "Trigger", 1, 1, 100, 100, "node-trigger",
  {},
  `<div class="node-header">Trigger</div>
   <div class="df-node-text">Ny vecka → skapa uppdrag</div>`
);

const actionId1 = editor.addNode(
  "Action", 1, 1, 400, 100, "node-action",
  {},
  `<div class="node-header">Action</div>
   <div class="df-node-text">Skicka uppdrag till användare A</div>`
);

const actionId2 = editor.addNode(
  "Action", 1, 1, 400, 250, "node-action",
  {},
  `<div class="node-header">Action</div>
   <div class="df-node-text">Skicka uppdrag till användare B</div>`
);

const reviewId = editor.addNode(
  "Review", 2, 1, 700, 175, "node-review",
  {},
  `<div class="node-header">Review</div>
   <div class="df-node-text">Granska & godkänn</div>
   <select>
     <option value="VD">VD</option>
     <option value="Vice VD">Vice VD</option>
     <option value="Chef">Chef</option>
   </select>`
);

  console.log("Trigger-nod data:", editor.getNodeFromId(triggerId));
  console.log("Action1-nod data:", editor.getNodeFromId(actionId1));
  console.log("Action2-nod data:", editor.getNodeFromId(actionId2));
  console.log("Review-nod data:", editor.getNodeFromId(reviewId));

  // --- Koppla noder ---
  try {
    editor.addConnection(triggerId, "output_1", actionId1, "input_1");
    editor.addConnection(triggerId, "output_1", actionId2, "input_1");
    editor.addConnection(actionId1, "output_1", reviewId, "input_1");
    editor.addConnection(actionId2, "output_1", reviewId, "input_1");
    console.log("Kopplingar skapade mellan noderna.");
  } catch (err) {
    console.error("Misslyckades med kopplingar:", err);
  }

  // --- Event när koppling skapas ---
  editor.on("connectionCreated", (connection) => {
    console.log("Koppling skapad:", connection);
  });

  // --- Event för Review dropdown ---
  setTimeout(() => {
    const reviewerSelect = document.querySelector(`#node-${reviewId} #reviewer`);
    if (reviewerSelect) {
      reviewerSelect.addEventListener("change", (e) => {
        const node = editor.getNodeFromId(reviewId);
        if (node) {
          node.data.role = e.target.value;
          console.log("Review-nodens granskare uppdaterad till:", e.target.value);
        }
      });
    }
  }, 300); // vänta tills DOM för noden har byggts
};

// --- Workflow UI-knappar ---
window.setupWorkflowButtons = function() {
  const workflowBtn = document.getElementById("workflowBtn");
  const closeBtn = document.getElementById("closeWorkflow");
  const stage = document.getElementById("stage");
  const workflowStage = document.getElementById("workflowStage");

  // Byt ut knappar för att rensa gamla event-listeners
  workflowBtn.replaceWith(workflowBtn.cloneNode(true));
  closeBtn.replaceWith(closeBtn.cloneNode(true));

  const newWorkflowBtn = document.getElementById("workflowBtn");
  const newCloseBtn = document.getElementById("closeWorkflow");

  newWorkflowBtn.addEventListener("click", () => {
    stage.style.display = "none";
    workflowStage.style.display = "block";
    newWorkflowBtn.style.display = "none";
    newCloseBtn.style.display = "inline-block";
    window.initWorkflow();
  });

  newCloseBtn.addEventListener("click", () => {
    workflowStage.style.display = "none";
    stage.style.display = "block";
    newCloseBtn.style.display = "none";
    newWorkflowBtn.style.display = "inline-block";
  });
};
