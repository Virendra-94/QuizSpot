import React, { useState, useEffect } from "react";
import { useHistory, useLocation } from "react-router-dom";
import Loader from "react-loader-spinner";
import jwt from "jsonwebtoken";
import "./Quiz.css";

function Quiz() {
  const history = useHistory();
  const location = useLocation();
  const quizData = location.state.quizData;
  const quizId = location.state.quizId;
  const [quesNumber, setQuesNumber] = useState(0);
  const [answers, setAnswers] = useState({});
  const [error, setError] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30); 
  let score = 0;

 
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      const data = jwt.decode(token);
      if (!data.email) {
        localStorage.removeItem("token");
        history.replace("/login");
      }
      if (Date.now() > jwt.decode(token).exp * 1000) {
        localStorage.removeItem("token");
        history.replace("/login");
      }
    } else {
      localStorage.removeItem("token");
      history.replace("/login");
    }
  }, [history]);

 
  useEffect(() => {
    if (timeLeft === 0) {
      handleAutoNext();
    }
    const timer = setInterval(() => {
      setTimeLeft((prevTime) => (prevTime > 0 ? prevTime - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [handleAutoNext]);

  
  useEffect(() => {
    setTimeLeft(30); 
  }, [quesNumber]);

  function handleQuestionChange(event) {
    event.preventDefault();
    if (event.target.name === "prev" && quesNumber > 0) {
      setQuesNumber(quesNumber - 1);
    }
    if (event.target.name === "next" && quesNumber < quizData.length - 1) {
      setQuesNumber(quesNumber + 1);
    }
  }

  function handleAutoNext() {
    if (quesNumber < quizData.length - 1) {
      setQuesNumber(quesNumber + 1);
    }
  }

  function handleQuestionSubmit(event) {
    setAnswers({ ...answers, [quesNumber]: event.target.value });
  }

  async function handleResult() {
    let myScore = 0;
    setLoading(true);
    Object.keys(answers).map((answer, index) => {
      Object.keys(quizData[index].correct_answers).map((correctAnswer) => {
        if (
          quizData[index].correct_answers[correctAnswer] === "true" &&
          answers[answer] + "_correct" === correctAnswer
        ) {
          myScore += 1;
        }
      });
    });
    score = score + myScore;

    const req = await fetch("https://quiz-spot-server.vercel.app/api/result", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-access-token": localStorage.getItem("token"),
      },
      body: JSON.stringify({
        quizId: quizId,
        score: score,
      }),
    });

    const data = await req.json();
    setLoading(false);
    if (data.status === "ok") {
      history.push({
        pathname: "/result",
        state: { quizId: quizId },
      });
    } else {
      setError(true);
      setErrorMsg(data.message);
      return;
    }
  }

  return (
    <div>
      {loading ? (
        <Loader
          className="loader"
          type="Grid"
          color="#fff"
          height={100}
          width={100}
        />
      ) : (
        <div>
          <h1 className="heading">Quiz Spot</h1>
          <div className="question-form">
            <div className="question">
              {quesNumber + 1}. {quizData[quesNumber].question}
            </div>
            <div className="timer">Time left: {timeLeft} seconds</div>
            {Object.keys(quizData[quesNumber].answers).map((key) => {
              if (quizData[quesNumber].answers[key] !== null)
                return (
                  <div className="option" key={key}>
                    <label htmlFor={key}>
                      <input
                        type="radio"
                        id={key}
                        name={`question-${quesNumber}`}
                        value={key}  // Set value to the key representing the answer
                        checked={answers[quesNumber] === key}  // Correctly check the selected option
                        onChange={handleQuestionSubmit}  // Use value to handle the change
                      />
                      {quizData[quesNumber].answers[key]}
                    </label>
                  </div>
                );
            })}

            <div className="btns">
              <button
                name="prev"
                onClick={handleQuestionChange}
                className="prev-button"
                disabled={quesNumber === 0}
              >
                Previous
              </button>
              {quesNumber < quizData.length - 1 && (
                <button
                  name="next"
                  onClick={handleQuestionChange}
                  className="next-button"
                >
                  Next
                </button>
              )}
            </div>
            {error && <div className="error">{errorMsg}</div>}
          </div>
          {quesNumber === quizData.length - 1 && (
            <button className="submit-button" onClick={handleResult}>
              Submit
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default Quiz;

