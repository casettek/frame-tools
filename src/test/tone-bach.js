const Tone = await inlineImport("#tone");
const p5 = await inlineImport("#p5").default;

// See the 'assets' folder for our MP3 file URL
const MP3 =
  "https://cdn.glitch.com/2929cbe3-bafa-4b5f-833f-7debb607569b%2F1-02%20Blue%20Jeans%20(Gesaffelstein%20Remix).mp3?v=1569254348843";

// Master volume in decibels
const volume = -12;

let player, loaded, analyser;

let playing = false;

// Create a new canvas to the browser size
window.setup = async function () {
  createCanvas(windowWidth, windowHeight);

  // Clear with black on setup
  background(0);

  // Make the volume quieter
  Tone.Master.volume.value = volume;

  const midi = window.fflate.strFromU8(
    window.fflate.decompressSync(
      Uint8Array.from(
        atob(
          "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"
        ),
        (c) => c.charCodeAt(0)
      )
    )
  );
  console.log(midi);
  //synth playback
  const synths = [];
  const playing = true;
  if (playing) {
    const now = Tone.now() + 0.5;
    midi.tracks.forEach((track) => {
      //create a synth for each track
      const synth = new Tone.PolySynth({}, Tone.Synth, {
        envelope: {
          attack: 0.02,
          decay: 0.1,
          sustain: 0.3,
          release: 1,
        },
      }).toDestination();
      synths.push(synth);
      //schedule all of the events
      track.notes.forEach((note) => {
        synth.triggerAttackRelease(
          note.name,
          note.duration,
          note.time + now,
          note.velocity
        );
      });
    });
  }
  console.log(synths);

  // We can use 'player' to
  player = new Tone.Player();
  player.loop = true;
  player.autostart = false;
  player.loopStart = 1.0;
  player.connect(Tone.Master);

  // Load and "await" the MP3 file
  await player.load(MP3);

  // Create an analyser node that makes a waveform
  analyser = new Tone.Analyser("waveform", 64);

  // Connect with analyser as well so we can detect waveform
  player.connect(analyser);
  for (let syn of synths) {
    syn.connect(analyser);
  }
};

// On window resize, update the canvas size
window.windowResized = function () {
  resizeCanvas(windowWidth, windowHeight);
};

// Render loop that draws shapes with p5
window.draw = function () {
  // Ensure everything is loaded first
  if (!player || !analyser) return;

  const dim = Math.min(width, height);

  // Black background
  background(0, 0, 0, 10);

  strokeWeight(dim * 0.0025);
  stroke(255);
  noFill();

  // Draw waveform if playing
  if (playing) {
    const values = analyser.getValue();

    beginShape();
    for (let i = 0; i < values.length; i++) {
      const amplitude = values[i];
      const x = map(i, 0, values.length - 1, 0, width);
      const y = height / 2 + amplitude * height;
      // Place vertex
      vertex(x, y);
    }
    endShape();
  }

  // Draw a 'play' or 'stop' button
  noStroke();
  fill(255);
  polygon(
    width / 2,
    height / 2,
    dim * 0.1,
    playing ? 4 : 3,
    playing ? PI / 4 : 0
  );
};

window.mousePressed = function () {
  if (player && player.loaded) {
    if (playing) {
      playing = false;
      player.stop();
    } else {
      playing = true;
      player.restart();
    }
  }

  // Small detail here: clear the screen to black and then
  // force a re-draw so there is no blur
  background(0);
  redraw();
};

// Draw a basic polygon, handles triangles, squares, pentagons, etc
function polygon(x, y, radius, sides = 3, angle = 0) {
  beginShape();
  for (let i = 0; i < sides; i++) {
    const a = angle + TWO_PI * (i / sides);
    let sx = x + cos(a) * radius;
    let sy = y + sin(a) * radius;
    vertex(sx, sy);
  }
  endShape(CLOSE);
}
