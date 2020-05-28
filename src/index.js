const USER_URL = 'http://localhost:3000/users'
const LETTER_LIST_URL = 'http://localhost:3000/letter_lists'
const GAME_URL = 'http://localhost:3000/games'

const mainContainer = document.querySelector(".page-container")
const container = document.querySelector(".login-container")
const userDisp = document.querySelector(".user-display")
const login = document.querySelector(".log-in")
const userDisplayName = document.querySelector("#user-display-name")
const playArea = document.querySelector(".play-area")
const charList = document.querySelector("#char-list")
const goodWords = document.querySelector("#good-words")
const wordInput = document.querySelector("#word")
const saveWord = document.querySelector("#save-word")
const resultDiv = document.querySelector(".result")
const resultList = document.querySelector("#result-list")
const scoreDisp = document.querySelector("#score")
const userGames = document.querySelector(".user-games")
const currentScore = document.querySelector("#current-score")
const playAgain = document.querySelector("#play-again")
const guessInput = document.querySelector("#word")
const timer = document.getElementById("timer")
const highscores = document.querySelector(".highscores")
const highscoreAlert = document.querySelector("#highscore-alert")
const modal = document.getElementById("myModal")
const modalText = document.getElementById("modal-text")
const span = document.getElementsByClassName("close")[0]

const sounds = {
  playFoundWord: () => {
    const foundWord = new Audio()
    foundWord.src = "src/sound_effects/foundWord.mp3"
    foundWord.play()
  },
  playgameDone: () => {
  const gameDone = new Audio()
  gameDone.src = "src/sound_effects/gameDone.mp3"
  gameDone.play()
  },
  playHighscore: () => {
    const highscoreSound = new Audio()
    highscoreSound.src = "src/sound_effects/highscore.mp3"
    highscoreSound.play()
  },
  playLoadLetters: () => {
    const loadLetters = new Audio()
    loadLetters.src = "src/sound_effects/loadLetters.mp3"
    loadLetters.play()
  },
  playKeyPress: () => {
    const keyPress = new Audio()
    keyPress.src = "src/sound_effects/keyPress.mp3"
    keyPress.play()
  },
  playBackSpace: () => {
    const backSpace = new Audio()
    backSpace.src = "src/sound_effects/backSpace.mp3"
    backSpace.play()
  },
  playBadWord: () => {
    const badWord = new Audio()
    badWord.src = "src/sound_effects/badWord.mp3"
    badWord.play()
  },
  playChallenge: () => {
    const challenge = new Audio()
    challenge.src = "src/sound_effects/challenge.mp3"
    challenge.play()
  },
  playReplayIt: () => {
    const replayIt = new Audio()
    replayIt.src = "src/sound_effects/replayIt.mp3"
    replayIt.play()
  }
}
const highscoreHeader = document.querySelector("#highscore-header")
const userGamesHeader = document.querySelector("#user-games-header")

// this set up the timeline function to be used for animation
const tl = gsap.timeline();
let wordGenerated = ""
let wordListGen = ""
let currentUser
let score = 0
let replayAGame = false
let charIdx = []
let scoreToBeat = 0

//Character distribution taken from standard Scrabble distribution
const characters = "aaaaaaaaabbccddddeeeeeeeeeeeefffggghhiiiiiiiiijkllllmmnnnnnnooooooooppqrrrrrrsssssttttttuuuuvvwwxyyz"
const charNum = 10
let li = ""

function main(){
  // this is to set up the modal popup alert
  span.onclick = function() {
    modal.style.display = "none";
  }
  window.onclick = function(event) {
    if (event.target == modal) {
      modal.style.display = "none";
    }
  }

  mainContainer.style.display = "block"
  container.style.display = "block"
  highscoreHeader.style.display = "none"
  userDisp.style.display = "none"
  playArea.style.display = "none"
  playAgain.style.display = "none"
  highscoreAlert.style.display = "none"
  userGamesHeader.style.display = "none"
  highscores.style.display = "none"
  
  // add listener for login submit
  login.addEventListener("submit", userLogin)
  // add listener for key press
  // enter will trigger word checks
  // backspace will un-highlight the character enter
  // anyother char will trigger highlight char check
  wordInput.addEventListener("keyup", (event) => {
    if (event.key === "Enter"){
      wordCheck(event)
    } else if (event.keyCode === 8){
      sounds.playBackSpace()
      unhighlightChar(event)
    }else {
        sounds.playKeyPress()
        highlightChar(event)
    }
  })
  saveWord.addEventListener("click", saveList)
  playAgain.addEventListener("click", playGameAgain)
  userGames.addEventListener("click", replayGame)
  highscores.addEventListener("click", replayGame)
}

// this function login a new user. Backend will generate a new one if not found.
// it then load the high scores from DB
// it them load all the games played by user before
function userLogin(event){
  // this line call checkRegex to prime the dictionary so it's faster during play
  checkRegex("a")
  event.preventDefault()
  let userName = event.target[0].value

  const reqObj = {
    method: 'POST',
    headers: {
      'content-type': 'application/json'
    },
    body: JSON.stringify({name: userName})
  }

  loadHighscores()
  highscores.style.display = "flex"

  fetch(USER_URL, reqObj)
  .then(resp => resp.json())
  .then(userData => {
    // the following animate the buttons and labels
    container.style.display = "none"
    userDisp.style.display = "block"
    tl.from(userDisplayName, {duration: 0.5, opacity: 0, y: -100, ease: "power2.out"});
    tl.from(playAgain, {duration: 0.5, opacity: 0, y: -100, ease: "power2.out"});
    highscoreHeader.style.display = "block"
    tl.from(highscoreHeader, {duration: 0.5, opacity: 0, y: -100, ease: "power2.out"});
    userGamesHeader.style.display = "block"
    tl.from(userGamesHeader, {duration: 0.5, opacity: 0, y: -100, ease: "power2.out"});
    userDisplayName.innerText = `Welcome, ${userData.name}! Let's play!`

    // this display all the games played before
    displayUserGames(userData)
    currentUser = userData
    playAgain.style.display = "inline"
  })
}

// this loads the highscores from backend. The index route on backend returns top 3 scores data
function loadHighscores(){
  highscores.innerHTML = ""
  fetch(GAME_URL)
  .then(resp => resp.json())
  .then(highscoreData => {
    highscoreData.forEach(game => {
      scoreToBeat = game.score
      let cardData = `<div class="highscore-card" data-list-id=${game.letter_list_id}>
        <p>${game.letter_list.letters.split("").join(", ")}</p>
        <h4>${game.user.name}</h4>
        <p>Score: ${game.score}</p>
        <button class="replay">Challenge</button>
      </div>`
      highscores.innerHTML += cardData
    })
    tl.from(".highscore-card", {duration: 0.5, opacity: 0, y: -100, stagger: 0.1, ease: "power2.out"});
  })
}

// this displays all games played by user
function displayUserGames(userData){
  
  userData.games.forEach(game => {
    let letterId = game.letter_list_id
    let letterList = userData.letter_lists.find(letterL => {
      return letterL.id === letterId
    })
    let gameObj = {
      word_list: game.word_list,
      score: game.score,
      letter_list_id: letterId,
      letter_list: letterList.letters
    }
    userGames.innerHTML += displayOneGame(gameObj)
    })
    tl.from(".user-card", {duration: 0.5, opacity: 0, y: -100, ease: "power2.out"});
}

// this display one single game card
function displayOneGame(gameObj){
  return `<div class="user-card" data-list-id=${gameObj.letter_list_id}> <p>${gameObj.letter_list.split("").join(", ")}</p>` + 
  `<p>Score: ${gameObj.score}</p>` + `<button class="replay">Replay</button>` +
    `</div>`
}

// this is the main game play logic
function playGame(user){
  // currentUserId = user.id
  playAgain.style.display = "none"
  container.style.display = "none"
  userDisplayName.innerText = `Welcome, ${user.name}! Let's play with words!`
  userDisp.style.display = "block"
  goodWords.innerHTML = ""
  currentScore.innerHTML = ""
  
  li = ""
  score = 0
  word.disabled = false
  // only reload new letters when it is not a replay of played game
  if (!replayAGame){ 
    wordGenerated = ""
    getChars()
  } else {
    replayAGame = false
  }
  playArea.style.display = "block"
  saveWord.disabled = true
  timer.innerHTML = `Game ends in <span id="time">02:00</span>`
  // turn off display of all replay buttons
  turnOffReplay()
  // start countdown of 2 min
  countdown(2)

  // this is the countdown funtion for the 2 min timer
  function countdown(minutes) {
    let seconds = 60;
    let mins = minutes
    function tick() {
      //This script expects an element with an ID = "counter". You can change that to what ever you want. 
      let counter = document.getElementById("time");
      let current_minutes = mins-1
      seconds--;
      if (current_minutes === 0 && seconds === 0){
        timer.childNodes[1].remove()
        // guessInput.style.display = "none"
        sounds.playgameDone()
        timer.innerText = "Time's up!"
        saveWord.disabled = false
        word.disabled = true
      }
      counter.innerHTML = current_minutes.toString() + ":" + (seconds < 10 ? "0" : "") + String(seconds);
      if( seconds > 0 ) {
        setTimeout(tick, 1000);
      } else {
          if(mins > 1){
            countdown(mins-1);           
          }
      }
    }
    tick();
  }
}

// this get a random 10 letters from the char list
// generated list is sent to backend for update
function getChars(){
  for ( var i = 0; i < charNum; i++ ) {
    wordGenerated += characters.charAt(Math.floor(Math.random() * 100));
  }
  fetch(LETTER_LIST_URL, {
    method: 'POST',
    headers: {'content-type': 'application/json'},
    body: JSON.stringify({letter_list: wordGenerated})
  })
  .then(resp => resp.json())
  .then(wordData => {
    charList.dataset.listId = wordData.id
    loadAnimatedChar(wordData.letters)
  })
}

// this check if the word is valid
function wordCheck(event){
  resetChars()
  charIdx = []
  
  let wordArray = wordGenerated.split("")
  let goodBad = true

  // this check if letter entered is on list or alreadt exhausted
  event.target.value.split("").forEach(char => {
    let idx = wordArray.indexOf(char)
    if (idx < 0){
      goodBad = false
      event.target.value = ""      
    } else {
      wordArray.splice(idx, 1)
    }
  })
  if (!goodBad){
    sounds.playBadWord()
    modal.style.display = "block"
    modalText.innerText = "Letter not on list or already used up!"
  } else {
    // this check if the word is good and if same word is resused
    if (checkRegex(event.target.value)){
      if (wordListGen.includes(" " + event.target.value + " ")){
        sounds.playBadWord()
        goodBad = false
        event.target.value = ""
        modal.style.display = "block"
        modalText.innerText = "Cannot reuse accepted words!"
      } else {
        wordListGen = wordListGen + " " + event.target.value + " "
      }
    } else {
      sounds.playBadWord()
      goodBad = false
      event.target.value = ""
      modal.style.display = "block"
      modalText.innerText = "Word is not in the dictionary!"
    }
  }
  if (goodBad){
    // increment score if word is good
    sounds.playFoundWord()
    li += `<li>${event.target.value}</li>`
    score += event.target.value.length
    currentScore.innerHTML = `Score: ${score}`
    event.target.value = ""
    goodWords.innerHTML = li
  }
}

// this check word against disctionary
function checkRegex(word) {
  return regex.test(word)
}

// this save the word list to the backend
function saveList(event){
  playArea.style.display = "none"
  let list = [] 
  goodWords.childNodes.forEach(word => {
    list.push(word.innerText)
  })
  let wordToSave = list.join(", ")
  let dataObj = {
    word_list: wordToSave,
    score: score,
    user_id: currentUser.id,
    letter_list_id: charList.dataset.listId
  }
  
  fetch(GAME_URL, {
    method: 'POST',
    headers: {'content-type': 'application/json'},
    body: JSON.stringify(dataObj)  
  })
  .then(resp => resp.json())
  .then(gameResult => {
    let gameObj = {
      letter_list_id: charList.dataset.listId,
      word_list: wordToSave,
      score: score,
      letter_list: wordGenerated
    }
    userGames.innerHTML += displayOneGame(gameObj)
    console.log(wordToSave, score)
  })
  playAgain.style.display = "inline"
  replays = document.getElementsByClassName("replay")
  for (let i = 0; i < replays.length; i++){ 
    replays[i].style.display = "inline"
  }
  // if score beats the lowest of the highscore, reload the highscore cards
  if (score > scoreToBeat){
    sounds.playHighscore()
    highscoreAlert.style.display = "block"
    highscores.innerHTML = ""
    tl.fromTo(highscoreAlert, {opacity: 1, fontSize: 0, color: "red"}, {duration: 4, opacity: 0, fontSize: 150, onComplete : function(){
      highscoreAlert.style.display = "none"
      loadHighscores()
    }});
  }
}

// this is triggered when user wants to play a new game
function playGameAgain(){
  playArea.style.display = "block"
  charList.innerHTML = ""
  // turnOffReplay()
  playGame(currentUser)
  playAgain.innerText = "Play again"
}

// this is triggered when user wants to replay an old game or a challenge
function replayGame(event){
  if (event.target.className === "replay"){
    if(event.target.parentNode.className === "highscore-card"){
      sounds.playChallenge()
    } else {
      sounds.playReplayIt()
    }
    charList.innerHTML = ""
    wordGenerated = event.target.parentNode.firstElementChild.innerText.split(", ").join("")
    charList.dataset.listId = event.target.parentNode.dataset.listId
    loadAnimatedChar(wordGenerated)
    replayAGame = true    
    playGame(currentUser)
  }
}

// this turns off all the replay buttons
function turnOffReplay(){
  replays = document.getElementsByClassName("replay")
  for (let i = 0; i < replays.length; i++){ 
    replays[i].style.display = "none"
  }
}

// this load the letters thru animation
function loadAnimatedChar(wordInput){
  sounds.playLoadLetters()
  let arr = wordInput.split("")
    arr.forEach(letter => {
      charList.innerHTML += `<div class="guess-letter"><p>${letter}</p></div>`
    })
    tl.from(".guess-letter", {duration: 1, opacity: 0, x: 500, y: 500, stagger: 0.1, rotate: 720, ease: "back"}); 
    resetChars()
     
}

// this highlights the letter typed that mataches the one on char list
function highlightChar(){
  for (i = 0; i < charList.children.length; i++){
    if (event.key.toUpperCase() === charList.children[i].innerText && charList.children[i].className !== "found-letter"){
      charList.children[i].className = "found-letter"
      charIdx.unshift(i)
      break
    }
  }
  if (i === charList.children.length){
    charIdx.unshift("x")
  }
}

// this un-highlights the letter when backspace is hit
function unhighlightChar(){
  if (charIdx[0] !== "x"){
  charList.children[charIdx[0]].className = "guess-letter"
  } 
  charIdx.shift()
}

// this reset the color of all letters after a reload.
function resetChars(){
  for (i = 0; i < charList.children.length; i++){
    charList.children[i].className = "guess-letter"
  }
}
main()
