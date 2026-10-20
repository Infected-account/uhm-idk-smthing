
const audioBtn = document.getElementById("audioBtn");
const signalBtn = document.getElementById("signalBtn");
const returnBtn = document.getElementById("returnBtn");

const status = document.getElementById("status");
const message = document.getElementById("message");
const integrity = document.getElementById("integrity");
const jumpscare = document.getElementById("jumpscare");

let audioContext;
let noiseSource;
let audioEnabled = false;
let signalFound = false;
let scareTimer;

function startStatic() {
  const AudioContextClass =
    window.AudioContext || window.webkitAudioContext;

  if (!AudioContextClass) {
    status.textContent = "AUDIO NOT SUPPORTED BY THIS BROWSER.";
    return;
  }

  audioContext = audioContext || new AudioContextClass();
  audioContext.resume();

  const bufferSize = audioContext.sampleRate * 2;
  const buffer = audioContext.createBuffer(
    1, bufferSize, audioContext.sampleRate
  );

  const data = buffer.getChannelData(0);

  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }

  noiseSource = audioContext.createBufferSource();
  noiseSource.buffer = buffer;
  noiseSource.loop = true;

  const filter = audioContext.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = 3600;

  const volume = audioContext.createGain();
  volume.gain.value = 0.075;

  noiseSource.connect(filter);
  filter.connect(volume);
  volume.connect(audioContext.destination);

  noiseSource.start();

  audioEnabled = true;
  audioBtn.textContent = "■ DISABLE STATIC AUDIO";
  status.textContent = "AUDIO ON // CARRIER HISSING";
}

function stopStatic() {
  if (noiseSource) {
    noiseSource.stop();
    noiseSource.disconnect();
    noiseSource = null;
  }

  audioEnabled = false;
  audioBtn.textContent = "▶ ENABLE STATIC AUDIO";
  status.textContent = "AUDIO OFF // SIGNAL UNSTABLE";
}

audioBtn.addEventListener("click", () => {
  if (audioEnabled) {
    stopStatic();
  } else {
    startStatic();
  }
});

function creepyTone() {
  if (!audioEnabled || !audioContext) return;

  const oscillator = audioContext.createOscillator();
  const volume = audioContext.createGain();

  oscillator.type = "sawtooth";
  oscillator.frequency.setValueAtTime(
    92, audioContext.currentTime
  );
  oscillator.frequency.exponentialRampToValueAtTime(
    38, audioContext.currentTime + 0.9
  );

  volume.gain.setValueAtTime(0.0001, audioContext.currentTime);
  volume.gain.exponentialRampToValueAtTime(
    0.12, audioContext.currentTime + 0.08
  );
  volume.gain.exponentialRampToValueAtTime(
    0.0001, audioContext.currentTime + 1.1
  );

  oscillator.connect(volume);
  volume.connect(audioContext.destination);

  oscillator.start();
  oscillator.stop(audioContext.currentTime + 1.15);
}

function triggerScare() {
  clearTimeout(scareTimer);
  jumpscare.hidden = false;
  status.textContent = "SIGNAL OVERRIDE // CONNECTION LOST";
  creepyTone();
}

signalBtn.addEventListener("click", () => {
  if (signalFound) {
    triggerScare();
    return;
  }

  signalFound = true;
  integrity.textContent = "7%";
  message.textContent = "WE SEE YOU";
  message.style.color = "#ff353d";

  status.textContent = "SIGNAL FOUND // SOMETHING RESPONDS";
  signalBtn.textContent = "ANSWER THE SIGNAL";

  creepyTone();

  // The signal interrupts after 6.5 seconds.
  scareTimer = setTimeout(triggerScare, 6500);
});

returnBtn.addEventListener("click", () => {
  clearTimeout(scareTimer);
  jumpscare.hidden = true;

  signalFound = false;
  integrity.textContent = "UNKNOWN";
  message.textContent = "NO CARRIER";
  message.style.color = "";
  signalBtn.textContent = "TUNE INTO SIGNAL";

  status.textContent = "CONNECTION CLOSED // PROBABLY";
});

const messages = [
  "NO CARRIER",
  "SEARCHING...",
  "DO NOT ANSWER",
  "SIGNAL FOUND"
];

let index = 0;

setInterval(() => {
  if (!signalFound && jumpscare.hidden) {
    index = (index + 1) % messages.length;
    message.textContent = messages[index];
  }
}, 3600);

window.addEventListener("beforeunload", () => {
  if (audioContext) audioContext.close();
});
