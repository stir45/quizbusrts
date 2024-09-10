let ws;
let isWebSocketOpen = false; // 연결 상태를 추적하는 변수
let players = [];
let currentQuestion = null;
let playerName = "";
let currentQuestionIndex = 0;
let timeLeft = 30;
let interval;
let selectedQuestions = [];

const timerElement = document.getElementById("time");
const questionElement = document.getElementById("question");
const choicesElement = document.getElementById("choices");
const finalRankingElement = document.getElementById("finalRanking");

// WebSocket 초기화 함수
function initializeWebSocket() {
    ws = new WebSocket('ws://localhost:8080');

    ws.onopen = () => {
        console.log('WebSocket 연결 완료');
        isWebSocketOpen = true; // WebSocket 연결 완료 후 상태 변경
    };

    ws.onmessage = (event) => {
        const data = JSON.parse(event.data);

        if (data.type === 'startGame') {
            document.querySelector(".player-info").classList.add("hidden");
            document.querySelector(".question-section").classList.remove("hidden");
            currentQuestionIndex = 0;
            selectedQuestions = data.questions;
            loadQuestion(selectedQuestions[currentQuestionIndex]);
            startTimer();
        }

        if (data.type === 'nextQuestion') {
            currentQuestionIndex++;
            loadQuestion(data.question);
            resetTimer();
        }

        if (data.type === 'endGame') {
            endGame(data.ranking);
        }
    };

    ws.onerror = (error) => {
        console.error("WebSocket 오류 발생:", error);
    };

    ws.onclose = () => {
        console.log("WebSocket 연결이 닫혔습니다.");
    };
}

// Open Trivia API에서 질문을 가져오는 함수
function fetchQuestions(questionCount = 10) {
    const apiUrl = `https://opentdb.com/api.php?amount=${questionCount}&category=9&difficulty=medium&type=multiple`;

    return fetch(apiUrl)
        .then(response => response.json())
        .then(data => {
            selectedQuestions = data.results.map(item => ({
                question: item.question,
                choices: [...item.incorrect_answers, item.correct_answer].sort(() => Math.random() - 0.5),
                answer: item.correct_answer
            }));
        })
        .catch(error => console.error("Error fetching questions:", error));
}

// WebSocket이 연결될 때까지 대기하는 함수
function waitForSocketConnection(callback) {
    setTimeout(() => {
        if (isWebSocketOpen) {
            callback();
        } else {
            console.log("WebSocket 연결 대기 중...");
            waitForSocketConnection(callback); // 연결될 때까지 재귀 호출
        }
    }, 100); // 0.1초마다 체크
}

// 플레이어가 접속하면 서버에 참여 요청
document.getElementById("startGameBtn").addEventListener("click", () => {
    playerName = document.getElementById("playerName").value || "Player";

    waitForSocketConnection(() => {
        ws.send(JSON.stringify({ type: 'join', name: playerName }));
    });
});

// 질문 로드 함수
function loadQuestion(questionData) {
    currentQuestion = questionData;
    questionElement.innerHTML = questionData.question;
    choicesElement.innerHTML = "";

    questionData.choices.forEach(choice => {
        const li = document.createElement("li");
        li.classList.add("choice");
        li.innerText = choice;
        li.addEventListener("click", () => submitAnswer(choice));
        choicesElement.appendChild(li);
    });
}

// 답변 제출 함수
function submitAnswer(choice) {
    waitForSocketConnection(() => {
        ws.send(JSON.stringify({
            type: 'answer',
            name: playerName,
            answer: choice
        }));
    });
}

// 타이머 시작 함수
function startTimer() {
    timeLeft = 30;
    interval = setInterval(() => {
        timeLeft--;
        timerElement.innerText = timeLeft;

        if (timeLeft === 0) {
            clearInterval(interval);
            submitAnswer(null);
        }
    }, 1000);
}

// 타이머 리셋 함수
function resetTimer() {
    clearInterval(interval);
    startTimer();
}

// 게임 종료 함수
function endGame(ranking) {
    clearInterval(interval);
    document.querySelector(".question-section").classList.add("hidden");
    document.querySelector(".result-section").classList.remove("hidden");

    finalRankingElement.innerHTML = ranking.map((player, index) =>
        `<div>${index + 1}위: ${player.name} - ${player.score}점</div>`
    ).join("");
}

// 게임 재시작 버튼
document.getElementById("restartGameBtn").addEventListener("click", () => location.reload());

// WebSocket 연결 초기화
initializeWebSocket();
