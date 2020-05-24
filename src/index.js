const container = document.querySelector(".container")
const userDisp = document.querySelector(".user-display")
const login = document.querySelector(".log-in")
const user = document.querySelector("#user")
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

const characters = "abcdefghijklmnopqrstuvwxyz"
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
  // fetch to create user
  // after successful add user or find user
  container.style.display = "none"
  user.innerText = `${userName}, welcome! Let's play!`
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
    wordGen += characters.charAt(Math.floor(Math.random() * 26));
  }
  //send list to backend to add
  //charList.dataset.listId = ??
  charList.innerText = `Your alphabets: ${wordGen.split("").join(", ")}`
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
  
  if (goodBad){
    if (wordListGen.includes(event.target.value)){
      goodBad = false
      event.target.value = ""
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
  //send word to backend to save 
  resultList.innerText = wordToSave
  scoreDisp.innerText = `Your score is: ${score}`
  resultDiv.style.display = "block"
  console.log(wordToSave, score)
}
main()