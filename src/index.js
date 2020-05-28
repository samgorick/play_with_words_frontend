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
    }
}
const highscoreHeader = document.querySelector("#highscore-header")
const userGamesHeader = document.querySelector("#user-games-header")

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
  mainContainer.style.display = "block"
  container.style.display = "block"
  highscoreHeader.style.display = "none"
  userDisp.style.display = "none"
  playArea.style.display = "none"
  // resultDiv.style.display = "none"
  playAgain.style.display = "none"
  highscoreAlert.style.display = "none"
  userGamesHeader.style.display = "none"
  
  // hscores.style.display = "none"
  highscores.style.display = "none"
  
  login.addEventListener("submit", userLogin)
  wordInput.addEventListener("keyup", (event) => {
    if (event.key === "Enter"){
      wordCheck(event)
    } else if (event.keyCode === 8){
      unhighlightChar(event)
    }else {
        highlightChar(event)
    }
  })
  saveWord.addEventListener("click", saveList)
  playAgain.addEventListener("click", playGameAgain)
  userGames.addEventListener("click", replayGame)
  highscores.addEventListener("click", replayGame)
}

function userLogin(event){
  // checkRegex("a")
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
    container.style.display = "none"
    userDisp.style.display = "block"
    tl.from(userDisplayName, {duration: 0.5, opacity: 0, y: -100, ease: "power2.out"});
    tl.from(playAgain, {duration: 0.5, opacity: 0, y: -100, ease: "power2.out"});
    highscoreHeader.style.display = "block"
    tl.from(highscoreHeader, {duration: 0.5, opacity: 0, y: -100, ease: "power2.out"});
    userGamesHeader.style.display = "block"
    tl.from(userGamesHeader, {duration: 0.5, opacity: 0, y: -100, ease: "power2.out"});
    userDisplayName.innerText = `Welcome, ${userData.name}! Let's play!`

    displayUserGames(userData)
    currentUser = userData
    playAgain.style.display = "inline"
  })
}

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

function displayOneGame(gameObj){
  return `<div class="user-card" data-list-id=${gameObj.letter_list_id}> <p>${gameObj.letter_list.split("").join(", ")}</p>` + 
  `<p>Score: ${gameObj.score}</p>` + `<button class="replay">Replay</button>` +
    `</div>`
}

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
  if (!replayAGame){ 
    wordGenerated = ""
    getChars()
  } else {
    replayAGame = false
  }
  playArea.style.display = "block"
  saveWord.disabled = true
  timer.innerHTML = `Game ends in <span id="time">02:00</span>`
  countdown(2)

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

function wordCheck(event){
  resetChars()
  charIdx = []
  
  let wordArray = wordGenerated.split("")
  let goodBad = true

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
    alert("letter not on list or already used up")
  } else {
    if (checkRegex(event.target.value)){
      if (wordListGen.includes(" " + event.target.value + " ")){
        goodBad = false
        event.target.value = ""
        alert("Cannot reuse accepted words")
      } else {
        wordListGen = wordListGen + " " + event.target.value + " "
      }
    } else {
      goodBad = false
      event.target.value = ""
      alert("Word is not in the dictionary")
    }
  }
  if (goodBad){
    sounds.playFoundWord()
    li += `<li>${event.target.value}</li>`
    score += event.target.value.length
    currentScore.innerHTML = `Score: ${score}`
    event.target.value = ""
    goodWords.innerHTML = li
  }
}

function checkRegex(word) {
  return regex.test(word)
}

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

function playGameAgain(){
  playArea.style.display = "block"
  charList.innerHTML = ""
  turnOffReplay()
  playGame(currentUser)
  playAgain.innerText = "Play again"
}

function replayGame(event){
  if (event.target.className === "replay"){
    charList.innerHTML = ""
    wordGenerated = event.target.parentNode.firstElementChild.innerText.split(", ").join("")
    charList.dataset.listId = event.target.parentNode.dataset.listId
    loadAnimatedChar(wordGenerated)
    replayAGame = true    
    playGame(currentUser)
  }
}

function turnOffReplay(){
  replays = document.getElementsByClassName("replay")
  for (let i = 0; i < replays.length; i++){ 
    replays[i].style.display = "none"
  }
}

function loadAnimatedChar(wordInput){
  let arr = wordInput.split("")
    arr.forEach(letter => {
      charList.innerHTML += `<div class="guess-letter"><p>${letter}</p></div>`
    })
    tl.from(".guess-letter", {duration: 1, opacity: 0, x: 500, y: 500, stagger: 0.1, rotate: 720, ease: "back"}); 
    resetChars()
     
}

function highlightChar(){
  console.log(event.keyCode)
  for (i = 0; i < 10; i++){
    if (event.key.toUpperCase() === charList.children[i].innerText && charList.children[i].className !== "found-letter"){
      charList.children[i].className = "found-letter"
      charIdx.unshift(i)
      break
    }
  }
}

function unhighlightChar(){
  charList.children[charIdx[0]].className = "guess-letter"
  charIdx.shift()
}

function resetChars(){
  for (i = 0; i < 10; i++){
    charList.children[i].className = "guess-letter"
  }
}
main()
