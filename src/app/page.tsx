import Image from "next/image";
import styles from "./page.module.css";
import { getQuizzesIdsWithNames, getPopularQuizzes } from "./lib/firebase";
import QuizSelector from "./QuizSelector";

export default async function Home() {
  const quizIdsNames = await getQuizzesIdsWithNames();
  const popularQuizzes = await getPopularQuizzes();

  return (
    <>
      <main className={styles.mainContent}>
        <div className={styles.contentWrapper}>
          <section className={styles.quizListSection}>
            <div className={styles.titleHolder}>
              <h1>Witaj w Odrzutowiec2Wakacje</h1>
              <h2>Dostępne Quizy</h2>
            </div>
            <div className={styles.quizList}>
              <QuizSelector quizzes={quizIdsNames} />
            </div>
          </section>

          <aside className={styles.popularQuizzesSidebar}>
            <h3>Popularne Quizy</h3>
            <ul>
              {popularQuizzes!.map((quizName, index) => (
                <li key={index}>
                  <a href={`/game/${quizName.id}`}>{quizName.name}</a>
                </li>
              ))}
            </ul>
          </aside>
        </div>
      </main>
    </>
  );
}