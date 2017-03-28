/**
 * Simon configuration
 */
var config = {
  canvasSize: 430,
  squareSize: 200,
  gapSize: 10,
  background: '#222',
  fontStyle: {
    font: 'bold 2em Orbitron',
    fill: '#eee',
    boundsAlignH: 'center',
    boundsAlignV: 'middle'
  },
  counterSize: '4em',
  speed: 500, //milliseconds
  maxSteps: 20,
  introSequence: [0, 1, 2, 3],
  introSpeed: 300, // milliseconds
  errorSequence: [0, 1, 2, 3],
  errorSpeed: 1, // milliseconds
  strictMode: false,
  circle: {
    radius: 75,
    color: '#333'
  }
};

// Properties of each square
config.squares = [{
  name: 'one',
  size: [config.squareSize, config.squareSize],
  position: [config.gapSize, config.gapSize],
  color: '#00FF27',
  sound: 'http://crossorigin.me/https://s3.amazonaws.com/freecodecamp/simonSound1.mp3'
}, {
  name: 'two',
  size: [config.squareSize, config.squareSize],
  position: [
    (config.squareSize + (config.gapSize * 2)),
    config.gapSize
  ],
  color: '#FF4700',
  sound: 'http://crossorigin.me/https://s3.amazonaws.com/freecodecamp/simonSound2.mp3'
}, {
  name: 'three',
  size: [config.squareSize, config.squareSize],
  position: [
    config.gapSize,
    (config.squareSize + (config.gapSize * 2))
  ],
  color: '#FFE33B',
  sound: 'http://crossorigin.me/https://s3.amazonaws.com/freecodecamp/simonSound3.mp3'
}, {
  name: 'four',
  size: [config.squareSize, config.squareSize],
  position: [
    (config.squareSize + (config.gapSize * 2)),
    (config.squareSize + (config.gapSize * 2))
  ],
  color: '#0B81EB',
  sound: 'http://crossorigin.me/https://s3.amazonaws.com/freecodecamp/simonSound4.mp3'
}];


/**
 * Initialize phaser game
 */
var game = new Phaser.Game(
  config.canvasSize,
  config.canvasSize,
  Phaser.CANVAS,
  'simon', {
    preload: preload,
    create: create,
    update: update
  });

var simon = {};


/**
 * Preload game elements
 */
function preload() {

  // Preload squares sounds
  for (var i in config.squares) {
    game.load.audio(
      config.squares[i].name, [config.squares[i].sound]);
  }
}


/**
 * Create game elements
 */
function create() {
  
  game.stage.backgroundColor = config.background;

  // Add squares
  simon.squares = [];
  for (var i = 0; i < config.squares.length; i++) {
    simon.squares.push(
      createSquare(config.squares[i], i));
  }

  // Add center circular button
  simon.circleBg = createCircle({
    radius: config.circle.radius + config.gapSize,
    color: config.background
  });

  simon.circle = createCircle(config.circle);
  // Add input listener
  simon.circle.inputEnabled = true;
  simon.circle.input.pixelPerfectClick = true;
  simon.circle.events.onInputDown.add(action, this);
  simon.circle.input.priorityID = 99;
  simon.circleBg.inputEnabled = true;
  simon.circleBg.input.priorityID = 50;

  // Initialize action button
  simon.buttonText = game.add.text(
    0, 0, "Start", config.fontStyle);

  // Initialize counter
  simon.counterText = game.add.text(
    0, 0, '-',
    config.fontStyle);
  simon.counterText.fontSize = config.counterSize;
  
  centerButtonText();

  // Initialize sequence
  simon.currentSequence = [];
  simon.playerSequence = [];
  simon.playingSequence = true;

  // Play intro sequence
  playSequence(
    config.introSpeed, config.introSequence);

  simon.state = 'stop';
}


/**
 * Update game elements
 */
function update() {
  if (simon.squares[0].inputEnabled) {
    if(simon.state == 'stop' || simon.playingSequence) {
      toggleSquaresInput(false);
    }
  }
}


/**
 * Create Simon square sprites from bitmap data
 */
function createSquare(properties, num) {
  // Draw square
  var square = game.add.bitmapData(
    properties.size[0], properties.size[1]);
  square.ctx.beginPath();
  square.ctx.rect(0, 0, properties.size[0], properties.size[1]);
  square.ctx.fillStyle = properties.color;
  square.ctx.fill();

  // Create sprite from bitmap
  var sprite = game.add.sprite(
    properties.position[0], properties.position[1], square);

  // Add audio
  sprite.sound = game.add.audio(properties.name);

  // Add input listener
  sprite.inputEnabled = true;
  sprite.input.pixelPerfectClick = true;
  sprite.events.onInputDown.add(clicked, this);
  sprite.number = num;

  return sprite;
}

/**
 * Create centered circle sprite
 */
function createCircle(properties) {

  properties.posX = (config.canvasSize / 2) -
    properties.radius;
  properties.posY = properties.posX;

  // Draw circle
  var circle = game.add.bitmapData(
    properties.radius * 2, properties.radius * 2);

  circle.circle(
    properties.radius,
    properties.radius,
    properties.radius,
    properties.color);

  // Create sprite from bitmap
  var sprite = game.add.sprite(
    properties.posX,
    properties.posY,
    circle);

  return sprite;
}


/**
 * Make the sprite blink
 */
function blink(sprite) {
  sprite.alpha = 0;
  var tween1 = game.add.tween(sprite).to({
      alpha: 0
    },
    500,
    Phaser.Easing.Bounce.Out,
    true);

  var tween2 = game.add.tween(sprite).to({
      alpha: 1
    },
    500,
    Phaser.Easing.Bounce.Out,
    true);

  tween1.chain(tween2);
  tween1.start();

}

/**
 * Perform action once a square has been clicked
 */
function clicked(square) {

  // Blink animation & sound
  blink(square);
  square.sound.play();
  
  simon.playerSequence.push(square.number);

  // Check player sequence
  if (simon.playerSequence.length > simon.currentSequence.length) {
    lose();
    return;
  }

  for (var i in simon.playerSequence) {
    if (simon.currentSequence[i] != simon.playerSequence[i]) {
      lose();
      return;
    }
  }
  
  if (simon.playerSequence.length == simon.currentSequence.length) {

    if (simon.currentSequence.length == config.maxSteps) {
      win();
      return;
    }

    simon.playerSequence = [];
    
    // Simon's turn with a small delay
    setTimeout(function() {
      updateGameState('simon');
    }, config.speed * 2);
  }
  
}


/**
 * Generate new sequence
 */
function generateSequence(steps) {
  var sequence = [];
  for (var i = 0; i < steps; i++) {
    sequence.push(Math.floor((Math.random() * 10) % 4));
  }
  return sequence;
}

/**
 */
function addStep() {
  simon.currentSequence.push(Math.floor((Math.random() * 10) % 4));
}

/**
 * Play Simon sequence
 */
function playSequence(time, sequence) {
  time = time || config.speed;
  sequence = sequence || simon.currentSequence;
  simon.playingSequence = true;
  
  // Disable squares input while playing sequence
  toggleSquaresInput(false);

  // Enable input once sequence has ended
  setTimeout(function() {
    simon.playingSequence = false;
    toggleSquaresInput(true);
  }, time * (sequence.length + 1));

  for (var i = 0; i < sequence.length; i++) {
    setTimeout(function(o) {
      blink(simon.squares[sequence[o]]);
      simon.squares[sequence[o]].sound.play();
    }, time * (i + 1), i);
  }
}

/**
 * Enable/disable Squares input
 */
function toggleSquaresInput(inputEnabled) {
  for (var i in simon.squares) {
    simon.squares[i].inputEnabled = inputEnabled;
  }
}

/**
 * Perform action on button click
 */
function action(button) {
  blink(button);
  switch (String(simon.buttonText.text).toLowerCase()) {
    case 'start':
      updateGameState('simon');
      break;
    case 'stop':
      updateGameState('stop');
      break;
  }
}


/**
 * Update the state of the game
 */
function updateGameState(state) {
  console.log('updateGameState ' + state);
  simon.state = state;

  switch (state) {
    case 'stop':
      restartGame();
      break;
    case 'simon':
      simon.buttonText.setText('Stop');
      toggleSquaresInput(false);
      simonSays();
      break;
    case 'player':
      simon.buttonText.setText('Stop');
      toggleSquaresInput(true);
      break;
  }
}

/**
 * Add a new step and play the sequence
 */
function simonSays() {
  addStep();
  playSequence();
  simon.counterText.setText(simon.currentSequence.length);
  centerButtonText();
  updateGameState('player');
}

/**
 * Player lose
 */
function lose() {
  playSequence(config.errorSpeed, config.errorSequence);
  
  simon.playerSequence = [];

  if (config.strictMode) {
    simon.counterText.setText('LOSE');
    updateGameState('stop');
    return;
  }
  
  playSequence();
}

/**
 * Restart the game
 */
function restartGame() {
  toggleSquaresInput(false);
  simon.currentSequence = [];
  simon.playerSequence = [];
  simon.buttonText.setText('Start');
  centerButtonText();
}

/**
 * Player Win
 */
function win() {
  playSequence(100, [0,1,2,3,0,1,2,3]);
  simon.counterText.setText('WIN');
  updateGameState('stop');
}

/**
 * Center button text. Call when text has been updated
 */
function centerButtonText() {
  simon.buttonText.centerX = config.canvasSize / 2;
  simon.buttonText.centerY = (config.canvasSize / 2) +
    (config.circle.radius / 2);

  simon.counterText.centerX = config.canvasSize / 2;
  simon.counterText.centerY = config.canvasSize / 2;
}