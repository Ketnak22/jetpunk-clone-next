'use client';

import styles from "./page.module.css"

import { ChangeEvent, useRef, useState } from 'react';

export default function Home() {
    const [answersInputs, setAnswersInputs] = useState<string[]>([]);
    const [keysInputs, setKeysInputs] = useState<string[]>([]);

    const quizTypeSelectRef = useRef<HTMLSelectElement>(null);

    const handleAddInput = () => {
        setAnswersInputs(prev => [...prev, ""]);

        if (quizTypeSelectRef.current?.value === "matchingQuiz") {
            setKeysInputs(prev => [...prev, ""]);
        }
    }

    const handleRemoveInput = (index: number) => {
        setAnswersInputs(prev => prev.filter((_, idx) => idx !== index));

        if (quizTypeSelectRef.current?.value === "matchingQuiz") {
            setKeysInputs(prev => prev.filter((_, idx) => idx !== index));
        }
    }

    return (
        <div className={styles['creator-div']}>
            <input type="text" className={styles['question-input']} placeholder="Wpisz pytanie..."/>

            <div className={styles['quiz-type-wrapper']}>
                <label className={styles['quiz-type-label']} htmlFor="quiz-type-select">
                    Typ:
                </label>
                <select id="quiz-type-select" className={styles['quiz-type-select']} ref={quizTypeSelectRef} onChange={(e: ChangeEvent<HTMLSelectElement>) => {
                    if (e.target.value === "quiz") {
                        setKeysInputs([]);
                    } else if (e.target.value === "matchingQuiz") {
                        setKeysInputs(Array(answersInputs.length).fill(""));
                    }
                }}>
                    <option value="quiz">Quiz</option>
                    <option value="matchingQuiz">Matching Quiz</option>
                </select>
            </div>

            <div className={styles['key-answer-div']}>
                {quizTypeSelectRef.current?.value === "matchingQuiz" &&
                    <div className={styles['key-inputs-div']}>
                        {keysInputs.map((value, idx) => (
                            <div key={idx}>
                                <input type="text"value={value || ""} onChange={(e) => {
                                    const newKeys = [...keysInputs];
                                    newKeys[idx] = e.target.value;
                                    setKeysInputs(newKeys);
                                }} placeholder="Wpisz klucz..." />
                            </div>
                        ))}
                    </div>
                
                }

                <div className={styles['answer-inputs-div']}>
                    {answersInputs.map((value, idx) => (
                        <div key={idx} className={styles['answers-input-wrapper-div']}>
                            <input type="text" value={value || ""} onChange={(e) => {
                                const newInputs = [...answersInputs];
                                newInputs[idx] = e.target.value;
                                setAnswersInputs(newInputs);
                            }} placeholder="Wpisz odpowiedź..." />
                            <button className={styles['remove-btn']} onClick={() => handleRemoveInput(idx)}>X</button>
                        </div>
                    ))}
                </div>
                
            </div>
            <button className={styles['plus-btn']} onClick={handleAddInput}>+</button>
            {/* 
            TODO:
                - add form and submit to backend
                - add validation (e.g. min 2 answers, no empty answers, if matching quiz then no empty keys, etc.)
            */}
        </div>
    )
}