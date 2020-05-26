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
let wordGen = ""
let wordListGen = ""
let currentUserId

//Character distribution taken from standard Scrabble distribution
const characters = "aaaaaaaaabbccddddeeeeeeeeeeeeffggghhiiiiiiiiijkllllmmnnnnnnooooooooppqrrrrrrssssttttttuuuuvvwwxyyz"
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
  .then(userData => playGame(userData))
}

function playGame(user){
  currentUserId = user.id
  container.style.display = "none"
  userDisplayName.innerText = `Welcome, ${user.name}! Let's play!`
  userDisp.style.display = "block"
  getChars()
  playArea.style.display = "block"
  saveWord.disabled = true
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
        let timer = document.getElementById("timer")
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
    wordGen += characters.charAt(Math.floor(Math.random() * 100));
  }
  fetch(LETTER_LIST_URL, {
    method: 'POST',
    headers: {'content-type': 'application/json'},
    body: JSON.stringify({letter_list: wordGen})
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
  
  let wordAr = wordGen.split("")
  let goodBad = true

  event.target.value.split("").forEach(char => {
    let idx = wordAr.indexOf(char)
    if (idx < 0){
      goodBad = false
      event.target.value = ""      
    } else {
      wordAr.splice(idx, 1)
    }
  })
  if (!goodBad){
    alert("letter not on list or already used up")
  } else {
    if (wordListGen.includes(event.target.value)){
      goodBad = false
      event.target.value = ""
      alert("Cannot reuse accepted words")
    } else {
      wordListGen = wordListGen + event.target.value + " "
    }
  }
  if (goodBad){
    li += `<li>${event.target.value}</li>`
    event.target.value = ""
    goodWords.innerHTML = li
  }
}

function saveList(event){
  let list = [] 
  goodWords.childNodes.forEach(word => {
    list.push(word.innerText)
  })
  const score = goodWords.childElementCount
  let wordToSave = list.join(", ")
  
  fetch(GAME_URL, {
    method: 'POST',
    headers: {'content-type': 'application/json'},
    body: JSON.stringify({
      word_list: wordToSave,
      score: score,
      user_id: currentUserId,
      letter_list_id: charList.dataset.listId
    })  
  })
  .then(resp => resp.json())
  .then(gameResult => {
    resultList.innerText = gameResult.word_list
    scoreDisp.innerText = `Your score is: ${gameResult.score}`
    resultDiv.style.display = "block"
    console.log(wordToSave, score)
  })
}
main()