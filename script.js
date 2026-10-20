
const scene = document.querySelector("#scene");
const entity = document.querySelector("#entity");
const lightButton = document.querySelector("#lightButton");
const staticButton = document.querySelector("#staticButton");
const terminalButton = document.querySelector("#terminalButton");
const terminal = document.querySelector("#terminal");
const closeTerminal = document.querySelector("#closeTerminal");
const terminalForm = document.querySelector("#terminalForm");
const commandInput = document.querySelector("#command");
const output = document.querySelector("#output");

const sceneLabel = document.querySelector("#sceneLabel");
const sceneHint = document.querySelector("#sceneHint");
const entityStatus = document.querySelector("#entityStatus");
const archiveStatus = document.querySelector("#archiveStatus");
const lastMessage = document.querySelector("#lastMessage");

let lightOn = true;
let discovered = false;
let audioOn = false;
let audioContext;
let noiseSource;
let noiseGain;
let masterGain;

let pointerX = 0.5;
let pointerY = 0.5;

// Adjust these to place the hidden entity in the photograph.
// 0 = left/top, 1 = right/bottom.
const entityLocation = {
  x: 0.72,
  y: 0.47,
  radius: 0.105
};

function moveFlashlight(event) {
  const rect = scene.getBoundingClientRect();

  pointerX = Math.max(
    0, Math.min(1, (event.clientX - rect.left) / rect.width)
  );
  pointerY = Math.max(
    0, Math.min(1, (event.clientY - rect.top) / rect.height)
  );

  scene.style.setProperty("--beam-x", `${pointerX * 100}%`);
  scene.style.setProperty("--beam-y", `${pointerY * 100}%`);

  checkEntity();
}

scene.addEventListener("pointermove", moveFlashlight);

scene.addEventListener("pointerdown", (event) => {
  moveFlashlight(event);
});

function checkEntity() {
  if (!lightOn || discovered) return;

  const dx = (pointerX - entityLocation.x) *
    scene.clientWidth / scene.clientHeight;
  const dy = pointerY - entityLocation.y;

  const distance = Math.sqrt(dx * dx + dy * dy);

  if (distance < entityLocation.radius) {
    discovered = true;
    entityStatus.textContent = "VISUAL CONTACT";
    archiveStatus.textContent = "NEW DATA RECOVERED";
    sceneLabel.textContent = "CAMERA 04 // MOVEMENT CONFIRMED";
    sceneHint.textContent = "WHY IS IT STANDING THERE?";
    lastMessage.textContent =
      '"That figure was not present in the original recording."';

    document.querySelector("#connection").textContent =
      "SIGNAL: COMPROMISED";

    addLine("WARNING: UNREGISTERED FIGURE DETECTED.");
    addLine("ARCHIVE 0317 HAS BEEN UPDATED.");
  }
}

// Flashlight switch
lightButton.addEventListener("click", () => {
  lightOn = !lightOn;
  document.body.classList.toggle("light-off", !lightOn);

  lightButton.textContent =
    `FLASHLIGHT: ${lightOn ? "ON" : "OFF"}`;

  if (!lightOn) {
    sceneHint.textContent = "LIGHT SOURCE DISABLED";
  } else if (!discovered) {
    sceneHint.textContent = "MOVE YOUR FLASHLIGHT TO INVESTIGATE";
  } else {
    sceneHint.textContent = "IT IS STILL IN THE RECORDING.";
  }
});

// Terminal visibility
terminalButton.addEventListener("click", () => {
  terminal.hidden = !terminal.hidden;

  if (!terminal.hidden) {
    commandInput.focus();
  }
});

closeTerminal.addEventListener("click", () => {
  terminal.hidden = true;
});

// Terminal output
function addLine(message) {
  const line = document.createElement("p");
  line.textContent = message;
  output.appendChild(line);
  output.scrollTop = output.scrollHeight;
}

const commands = {
  help() {
    addLine("AVAILABLE COMMANDS:");
    addLine("help / status / scan / logs / whoami");
    addLine("decrypt / clear / exit");
  },

  status() {
    addLine(`LIGHT: ${lightOn ? "ACTIVE" : "DISABLED"}`);
    addLine(`ENTITY: ${discovered ? "DETECTED" : "UNCONFIRMED"}`);
    addLine(`ARCHIVE: ${discovered ? "UPDATED" : "LOCKED"}`);
  },

  scan() {
    if (discovered) {
      addLine("SCAN COMPLETE. ONE FIGURE CONFIRMED.");
      addLine("WARNING: FIGURE HAS NO ARCHIVE ID.");
    } else {
      addLine("SCAN COMPLETE. NO REGISTERED FIGURES.");
      addLine("...");
      addLine("UNREGISTERED OBJECTS MAY BE OMITTED.");
    }
  },

  logs() {
    addLine("[03:14] Camera 04 activated.");
    addLine("[03:16] Signal degradation detected.");
    addLine("[03:17] Image discrepancy reported.");
    addLine("[03:17] Operator status: UNKNOWN.");
  },

  whoami() {
    addLine("VISITOR SESSION ACTIVE.");
    addLine("IDENTITY: NOT PROVIDED.");
    addLine("ACCESS LEVEL: OBSERVER.");
  },

  decrypt() {
    if (!discovered) {
      addLine("ERROR: REQUIRED EVIDENCE NOT FOUND.");
      return;
    }

    addLine("DECRYPTION COMPLETE.");
    addLine("THE ROOM IS A RECORDING.");
    addLine("THE FIGURE IS NOT.");
  },

  clear() {
    output.replaceChildren();
  },

  exit() {
    terminal.hidden = true;
  }
};

terminalForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const command = commandInput.value.trim().toLowerCase();
  commandInput.value = "";

  if (!command) return;

  addLine(`visitor@signal:~$ ${command}`);

  if (commands[command]) {
    commands[command]();
  } else {
    addLine("UNKNOWN COMMAND. TYPE help.");
  }
});

// Generate static noise locally in the browser.
async function toggleStatic() {
  if (audioOn) {
    if (audioContext) await audioContext.close();

    audioContext = null;
    noiseSource = null;
    audioOn = false;
    staticButton.textContent = "STATIC AUDIO: OFF";
    return;
  }

  const AudioContextClass =
    window.AudioContext || window.webkitAudioContext;

  if (!AudioContextClass) {
    addLine("AUDIO UNAVAILABLE IN THIS BROWSER.");
    return;
  }

  audioContext = new AudioContextClass();
  await audioContext.resume();

  const bufferSize = audioContext.sampleRate * 2;
  const buffer = audioContext.createBuffer(
    1, bufferSize, audioContext.sampleRate
  );

  const data = buffer.getChannelData(0);

  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * 0.22;
  }

  noiseSource = audioContext.createBufferSource();
  noiseSource.buffer = buffer;
  noiseSource.loop = true;

  noiseGain = audioContext.createGain();
  noiseGain.gain.value = 0.10;

  masterGain = audioContext.createGain();
  masterGain.gain.value = 0.65;

  noiseSource.connect(noiseGain);
  noiseGain.connect(masterGain);
  masterGain.connect(audioContext.destination);
  noiseSource.start();

  audioOn = true;
  staticButton.textContent = "STATIC AUDIO: ON";
}

staticButton.addEventListener("click", toggleStatic);

// Start in the center of the room.
scene.style.setProperty("--beam-x", "50%");
scene.style.setProperty("--beam-y", "50%");

// Show a useful message if an image file is missing.
entity.addEventListener("error", () => {
  sceneHint.textContent = "ENTITY IMAGE MISSING: CHECK entity.png";
});

const roomImage = new Image();
roomImage.onerror = () => {
  sceneHint.textContent = "ROOM IMAGE MISSING: CHECK room.jpg";
};
roomImage.src = "room.jpg";
