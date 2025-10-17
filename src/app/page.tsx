import Image from "next/image";
import styles from "./page.module.css";
import { getQuizzesNames } from "./lib/firebase";

export default async function Home() {
  const quizNames = await getQuizzesNames();

  return (
    <main className={styles.main}>

      <h2>Select quiz</h2>
      <select>
          {quizNames.map((name, idx) => (
            <option key={idx} value={name}>
              {name}
            </option>
          ))
        }
      </select>
    </main>
  )
}