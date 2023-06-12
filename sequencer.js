// frequencies for the C minor pentatonic scale, bottom to top
const scale = [65.41, 73.42, 87.31, 98, 116.54, 130.81, 146.83, 174.61, 196, 233.08, 261.63, 293.66, 349.23, 392, 466.16, 523.25];

// state of the grid
let gridState = Array(16).fill().map(() => Array(16).fill(false));

// setup web audio api
let audioCtx = new (window.AudioContext || window.webkitAudioContext)();
let oscillator = {};
let gainNode = audioCtx.createGain();

// create the grid
const grid = document.querySelector('#grid');
for(let i = 0; i < 16; i++) {
  let row = document.createElement('div');
  row.className = 'gridrow';
  for(let j = 0; j < 16; j++) {
    let cell = document.createElement('div');
    cell.addEventListener('click', function() {
      gridState[i][j] = !gridState[i][j];
      cell.classList.toggle('active');
    });
    row.appendChild(cell);
  }
  grid.appendChild(row);
}

let bpmInput = document.querySelector('#bpm'); // added input field for BPM

// current interval id used for tempo
let intervalId;
// current column
let currentColumn = 0;

const k = 2;
function sigmoid(z) {
  return 1 / (1 + Math.exp(-z/k));
}

// create a compressor node
let compressor = audioCtx.createDynamicsCompressor();
compressor.threshold.value = -50;
compressor.knee.value = 40;
compressor.ratio.value = 12;
compressor.attack.value = 0;
compressor.release.value = 0.25;

// connect the compressor to the destination
compressor.connect(audioCtx.destination);

// create a delay node
let delay = audioCtx.createDelay(2.0);
delay.delayTime.value = 0.1;
// create a gain node for delay feedback
let delayGain = audioCtx.createGain();
delayGain.gain.value = 0.8; // adjust for the desired amount of feedback

// connect the nodes
delay.connect(delayGain);
delayGain.connect(delay); // feedback loop
compressor.connect(delay);
delay.connect(audioCtx.destination);

// function to start the sequencer
function startSequencer() {
  let bpm = bpmInput.value; 

  if(!bpm || bpm.startsWith('0')) {
    if(intervalId) {
      clearInterval(intervalId);
    }
    return;
  }

  let interval = 60000 / bpm; 

  if(intervalId) {
    clearInterval(intervalId); // clear the old interval
  }

  // play the grid like a sequencer
  intervalId = setInterval(function() {
    let activeCells = gridState.map(row => row[currentColumn]).filter(Boolean).length;
    let gainValue = 1 / Math.max(1, activeCells); // scale down the volume when more cells are active

    for(let i = 0; i < 16; i++) {
      if(gridState[i][currentColumn]) {
        playSound(scale[i], gainValue, bpm);
      }
    }
    // advance to the next column
    currentColumn = (currentColumn + 1) % 16; // loop back to 0 after reaching the end
  }, interval);
}

// listen for input changes and restart the sequencer
bpmInput.addEventListener('input', startSequencer);

// function to play a sound
function playSound(frequency, gainValue, bpm) {
    let oscillator = audioCtx.createOscillator(); // create a new oscillator for each sound
    oscillator.frequency.value = frequency;
    oscillator.type = 'sine';
    oscillator.start();
  
    let gainNode = audioCtx.createGain(); // create a new gainNode for each sound
  
    // scale attack and decay times inversely with bpm
    let attackTime = 0.01 * sigmoid(200/bpm); 
    let decayTime = 0.2//0.1 * sigmoid(200/bpm); 
    
    gainNode.gain.setValueAtTime(0, audioCtx.currentTime); // start at 0
    gainNode.gain.linearRampToValueAtTime(gainValue, audioCtx.currentTime + attackTime); // attack
    gainNode.gain.linearRampToValueAtTime(0, audioCtx.currentTime + decayTime); // decay
  
    oscillator.connect(gainNode) 
    gainNode.connect(compressor);
  
    setTimeout(function() {
      //gainNode.disconnect(audioCtx.destination);
      oscillator.stop();
    }, decayTime * 1000 + 100); // stop the sound after the decay is complete
  }

startSequencer(); // start the sequencer
