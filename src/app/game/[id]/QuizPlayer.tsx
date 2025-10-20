"use client";

import { useState, useEffect, useRef } from "react";
import QuizData from "@/app/types/QuizData";
import { FetchedGameData, QuizJSONData } from "@/app/types/FetchedGameData";

import styles from "./QuizPlayer.module.css";

export default function QuizPlayer({ quizId }: { quizId: string }) {
  const [quiz, setQuiz] = useState<QuizData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const answersTdRef = useRef<Array<HTMLTableCellElement | null>>([]);

  const handleAnswerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;

    quiz?.answers.forEach((answer, index) => {
      const answerLower = answer.toLowerCase();
      const valueLower = value.toLowerCase();

      if (answerLower === valueLower) {
        const tdElement = answersTdRef.current[index];
        if (tdElement && tdElement.textContent !== answer) {
          tdElement.textContent = answer;
          tdElement.classList.add("correct-answer");
          e.target.value = "";
        }
      }
    });
  };

  useEffect(() => {
    const controller = new AbortController();

    (async () => {
      try {
        const res = await fetch(`/api/quiz/${encodeURIComponent(quizId)}`, {
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
      <h1 className={styles["quiz-question"]}>{quiz.question}</h1>
      <input
        type="text"
        placeholder="Wpisz odpowiedź tutaj"
        onChange={handleAnswerChange}
        className={styles["quiz-input"]}
      />

      <table className={styles["quiz-table"]}>
        <tbody>
          {quiz.type === "matchingQuiz" && quiz.headers ? (
            <tr>
              <th>{quiz.headers[0]}</th>
              <th>{quiz.headers[1]}</th>
            </tr>
          ) : null}
          {quiz.answers.map((_, index) => (
            <tr key={index}>
              {quiz.type === "matchingQuiz" && quiz.keys ? (
                <td>{quiz.keys[index]}</td>
              ) : null}
              <td ref={el => { answersTdRef.current[index] = el; }}></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
