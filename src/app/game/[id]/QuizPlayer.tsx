"use client";

import { useState, useEffect, useRef } from "react";

import QuizData from "@/app/types/QuizData";
import FetchedGameData from "@/app/types/FetchedGameData";
import QuizJSONData from "@/app/types/QuizJSONData";

import styles from "./QuizPlayer.module.css";

import removePolishChars from "@/app/utils/removePolishChars";

export default function QuizPlayer({ quizId }: { quizId: string }) {
  const [quiz, setQuiz] = useState<QuizData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [points, setPoints] = useState<number>(0);
  const [maxPoints, setMaxPoints] = useState<number>(0);

  const [showResults, setShowResults] = useState<boolean>(false);

  const answersTdRef = useRef<Array<HTMLTableCellElement | null>>([]);

  const handleAnswerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;

    quiz?.answers.forEach((answer, index) => {
      const answerNormalised = removePolishChars(answer).toLowerCase();
      const valueNormalised = removePolishChars(value).toLowerCase();

      if (answerNormalised === valueNormalised) {
        const tdElement = answersTdRef.current[index];
        if (tdElement && tdElement.textContent !== answer) {
          tdElement.textContent = answer;
          tdElement.classList.add("correct-answer");

          setPoints((prev) => prev + 1);

          e.target.value = "";

          if (points + 1 == maxPoints) {
            e.target.disabled = true;
            setShowResults(true);
          }

        }
      }
    });
  };

  const handleGiveUp = () => {
    setShowResults(true);
    quiz?.answers.forEach((answer, index) => {
      const tdElement = answersTdRef.current[index];
      if (tdElement && tdElement.textContent !== answer) {
        tdElement.textContent = answer;
        tdElement.style.color = "#e02c4d";
      }
    });
  }

  useEffect(() => {
    const controller = new AbortController();

    (async () => {
      try {
        const res = await fetch(`/api/game/${encodeURIComponent(quizId)}`, {
          cache: "no-store",
          signal: controller.signal,
        });

        if (!res.ok) {
          throw new Error(res.status === 404 ? "Quiz not found" : "Failed to fetch quiz");
        }

        const data: FetchedGameData = await res.json();
        const jsonData: QuizJSONData = JSON.parse(data.jsonData);

        const naturalisedType = data.type === "matchingQuiz" ? "matchingQuiz" : "quiz";

        const quiz: QuizData = {
          id: quizId,
          question: jsonData.question,
          type: naturalisedType,
          answers: jsonData.answers,
          keys: jsonData.keys,
          headers: jsonData.headers,
          createdAt: data.createdAt,
        };

        if (typeof data.createdAt === "number") {
          data.createdAt = new Date(data.createdAt);
        }

        setQuiz(quiz);
        setMaxPoints(quiz.answers.length);
      } catch (err: any) {
        if (!controller.signal.aborted) {
          console.error(err);
          setError(err?.message ?? "Unknown error");
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    })();

    return () => {
      controller.abort();
    };
  }, [quizId]);

  if (loading) return <div className={styles["status-message"]}>Loading…</div>;
  if (error) return <div className={styles["status-message error"]}>{error}</div>;
  if (!quiz) return <div className={styles["status-message"]}>Quiz not available.</div>;

  return (
    <div className={styles['quiz-player-container']}>
      <div className={styles['quiz-card']}>
        <h1 className={styles["quiz-question"]}>{quiz.question}</h1>
        <div className={styles['quiz-controls']}>
          <div className={styles['points-display']}>
            <span>Punkty</span>
            <p>{points} / {maxPoints}</p>
          </div>
          {!showResults &&
            <button className={styles['give-up-btn']} onClick={handleGiveUp}>
              Poddaj się
            </button>
          }
        </div>
        {!showResults ? (
          <input
            type="text"
            placeholder="Wpisz odpowiedź..."
            onChange={handleAnswerChange}
            className={styles["quiz-input"]}
            autoFocus
          />
        ) : (
          <div className={styles['results']}>
            <h2>Koniec!</h2>
            <p>Twój ostateczny wynik to {points} na {maxPoints} punktów.</p>
          </div>
        )
        }

        <div className={styles['table-wrapper']}>
          <table className={styles["quiz-table"]}>
            {quiz.type === "matchingQuiz" && quiz.headers && (
              <thead>
                <tr>
                  <th>{quiz.headers[0]}</th>
                  <th>{quiz.headers[1]}</th>
                </tr>
              </thead>
            )}
            <tbody>
              {quiz.answers.map((_, index) => (
                <tr key={index}>
                  {quiz.type === "matchingQuiz" && quiz.keys ? (
                    <td className={styles['key-cell']}>{quiz.keys[index]}</td>
                  ) : null}
                  <td
                    ref={el => { answersTdRef.current[index] = el; }}
                    className={styles['answer-cell']}
                  >
                    {/* The blank space is intentional */}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
