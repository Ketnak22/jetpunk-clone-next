'use client';

import styles from "./page.module.css"

import { ChangeEvent, useRef, useState } from 'react';

export default function Page() {
    const [answersInputs, setAnswersInputs] = useState<string[]>([]);
    const [keysInputs, setKeysInputs] = useState<string[]>([]);

    const quizTypeSelectRef = useRef<HTMLSelectElement>(null);
    const nameInputRef = useRef<HTMLInputElement>(null);

    const keyHeaderRef = useRef<HTMLInputElement>(null);
    const answerHeaderRef = useRef<HTMLInputElement>(null);

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

    const handleSendButton = () => {
        if (!nameInputRef.current) return;
        if (!quizTypeSelectRef.current) return;
        if (answersInputs.length <= 0) return;
        if (answersInputs.some(ans => ans.trim() === "")) return;
        if (nameInputRef.current.value.trim() === "") return;
        if (quizTypeSelectRef.current.value === "matchingQuiz") {
            if (keysInputs.length !== answersInputs.length) return;
            if (keysInputs.some(key => key.trim() === "")) return;
            if (keyHeaderRef.current === null || answerHeaderRef.current === null) return;
            if (keyHeaderRef.current.value.trim() === "" || answerHeaderRef.current.value.trim() === "") return;
        }

        const preparedJson: { question: string; type: string; answers: string[]; keys?: string[], headers?: string[] } = {
            type: quizTypeSelectRef.current?.value,
            question: (document.querySelector(`.${styles['question-input']}`) as HTMLInputElement).value,
            answers: answersInputs.filter(ans => ans.trim() !== ""),
        };

        if (quizTypeSelectRef.current.value === "matchingQuiz") {
            preparedJson['keys'] = keysInputs.filter(key => key.trim() !== "");
            preparedJson['headers'] = [
                keyHeaderRef.current?.value ?? "",
                answerHeaderRef.current?.value ?? ""
            ];
        }

        const formData = new FormData();
        formData.append("quizData", JSON.stringify(preparedJson));
        formData.append("name", nameInputRef.current.value);

        fetch("/api/upload/quiz", {
            method: "POST",
            body: formData,
        }).then(res => {
            if (res.ok) {
                console.log("Quiz data sent successfully!");

                window.location.href = '/';
            } else {
                res.text().then(text => {
                    console.error("Error sending quiz data:", text);
                });              
            }
        }).catch(err => {
            console.error("Error sending quiz data:", err);
        });
    };

    return (
        <div className={styles['creator-div']}>
            <input type="text" className={styles['question-input']} placeholder="Wpisz pytanie..." ref={nameInputRef} minLength={1} maxLength={50} />

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


            {quizTypeSelectRef.current?.value === "matchingQuiz" && (
                <div className={styles['headers-div']}>
                    <input type="text" ref={keyHeaderRef} className={styles['question-input']} placeholder="Wpisz nagłówek klucza" minLength={1} maxLength={50} />
                    <input type="text" ref={answerHeaderRef} className={styles['question-input']} placeholder="Wpisz nagłówek odpowiedzi" minLength={1} maxLength={50} />
                </div>
            )}

            <div className={styles['key-answer-div']}>
                {quizTypeSelectRef.current?.value === "matchingQuiz" &&
                    <div className={styles['key-inputs-div']}>
                        {keysInputs.map((value, idx) => (
                            <div key={idx}>
                                <input type="text"value={value || ""} minLength={1} maxLength={50} onChange={(e) => {
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
                            <input type="text" value={value || ""} minLength={1} maxLength={50} onChange={(e) => {
                                const newInputs = [...answersInputs];
                                newInputs[idx] = e.target.value;
                                setAnswersInputs(newInputs);
                            }} placeholder="Wpisz odpowiedź..." />
                            <button className={styles['remove-btn']} onClick={() => handleRemoveInput(idx)}>X</button>
                        </div>
                    ))}
                </div>
                
            </div>

            <div>
                <button className={styles['plus-btn']} onClick={handleAddInput}>+</button>
            </div>

            <div className={styles['send-btn-wrapper']}>
                <button className={styles['send-btn']} onClick={handleSendButton}>Wyślij</button>
            </div>
            {/* 
            TODO:
                - add form and submit to backend
                - add validation (e.g. min 2 answers, no empty answers, if matching quiz then no empty keys, etc.)
            */}
        </div>
    )
}