const USER_URL = 'http://localhost:3000/users'
const LETTER_LIST_URL = 'http://localhost:3000/letter_lists'
const GAME_URL = 'http://localhost:3000/games'

const container = document.querySelector(".container")
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
const timer = document.getElementById("timer")


let wordGenerated = ""
let wordListGen = ""
let currentUser
let score = 0
let replayAGame = false

//Character distribution taken from standard Scrabble distribution
const characters = "aaaaaaaaabbccddddeeeeeeeeeeeefffggghhiiiiiiiiijkllllmmnnnnnnooooooooppqrrrrrrsssssttttttuuuuvvwwxyyz"
const charNum = 10
let li = ""

function main(){
  container.style.display = "block"
  userDisp.style.display = "none"
  playArea.style.display = "none"
  resultDiv.style.display = "none"
  
  login.addEventListener("submit", userLogin)
  wordInput.addEventListener("keypress", (event) => {
    if (event.key === "Enter"){
      wordCheck(event)
    }
  })
  saveWord.addEventListener("click", saveList)
  playAgain.addEventListener("click", playGameAgain)
  userGames.addEventListener("click", replayGame)
}

function userLogin(event){
  event.preventDefault()
  let userName = event.target[0].value

  const reqObj = {
    method: 'POST',
    headers: {
      'content-type': 'application/json'
    },
    body: JSON.stringify({name: userName})
  }

  fetch(USER_URL, reqObj)
  .then(resp => resp.json())
  .then(userData => {
    displayUserGames(userData)
    currentUser = userData
    playGame(userData)})
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

    turnOffReplay()
}

function displayOneGame(gameObj){
  return `<div class="user-card" data-list-id=${gameObj.letter_list_id}> <p>${gameObj.letter_list.split("").join(", ")}</p>` + 
    `<p>${gameObj.word_list}</p>` + `<p>Score: ${gameObj.score}</p>` + `<button class="replay">Replay</button>` +
    `</div>`
}

function playGame(user){
  // currentUserId = user.id
  playAgain.style.display = "none"
  container.style.display = "none"
  userDisplayName.innerText = `Welcome, ${user.name}! Let's play!`
  userDisp.style.display = "block"
  goodWords.innerHTML = ""
  resultDiv.style.display = "none"
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
        timer.innerText = "Time's up! Hit save to see your score..."
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
    charList.innerText = `Your alphabet: ${wordData.letters.split("").join(", ")}`
  })
}

function wordCheck(event){
  //perform word check against dictionary and char list
  //if successful return add the work to list
  
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
  let list = [] 
  goodWords.childNodes.forEach(word => {
    list.push(word.innerText)
  })
  // const score = calcScore(list)
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
    resultList.innerText = gameResult.word_list
    scoreDisp.innerText = `Your score is: ${gameResult.score}`
    resultDiv.style.display = "block"
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
}

function playGameAgain(){
  playGame(currentUser)
}

function replayGame(event){
  
  if (event.target.className === "replay"){
    charList.innerText = `Your alphabet: ${event.target.parentNode.firstElementChild.innerText}`
    wordGenerated = event.target.parentNode.firstElementChild.innerText.split(", ").join("")
    charList.dataset.listId = event.target.parentNode.dataset.listId
    turnOffReplay()
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
// function calcScore(list){
//   let score = 0
//   list.forEach(item => {
//     score += item.length
//   })
//   return score
// }

main()