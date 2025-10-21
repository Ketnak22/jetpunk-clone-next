import Image from "next/image";
import styles from "./page.module.css";
import { getQuizzesIdsWithNames, getPopularQuizzes } from "./lib/firebase";
import QuizSelector from "./QuizSelector";

export default async function Home() {
  const quizIdsNames = await getQuizzesIdsWithNames();
  const popularQuizzes = await getPopularQuizzes();

  return (
    <>
      <header className={styles['header']}>
        <div className={styles['headerElementsContainer']}>
          <img className={styles['jetpunkLogo']} src="/logo.png" width="190" height="65" alt="home" />
          <div className={styles['navContainer']}>
            <button>
              <a href="/create/quiz">Stwórz quiz</a>
            </button>
            <button>
              <a href="/create/map">Prześlij mapę</a>
            </button>
            <div className={styles['searchHolder']}>
              <input type="text" placeholder="Wyszukaj quiz" className={styles['searchHolderInput']} />
              <button type="button" className={styles['searchHolderButton']}>
                &#128269;
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className={styles['titleHolder']}>
        <h1>Witaj w Odrzutowiec2Wakacje</h1>
        <h2>Lista quizów:</h2>
      </div>
      <div className={styles['popularQuizes']}>
        <label>Popularne quizy:</label>
        <ul>
          {popularQuizzes.map((quizName, index) => (
            <li key={index}>
              {quizName}
            </li>
          ))}
        </ul>
      </div>

      <div className={styles['quizList']}>
        <QuizSelector quizzes={quizIdsNames} />
      </div>
    </>
  )
}