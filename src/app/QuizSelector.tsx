'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './QuizSelector.module.css'; // Import the new CSS module

type QuizSelectorProps = {
    quizzes: { id: string; name: string }[];
};

export default function QuizSelector({ quizzes }: QuizSelectorProps) {
    const [selectedId, setSelectedId] = useState(quizzes[0]?.id || '');
    const router = useRouter();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (selectedId) {
            router.push(`/game/${selectedId}`);
        }
    };

    return (
        <form onSubmit={handleSubmit} className={styles.formContainer}>
            <select
                value={selectedId}
                onChange={(e) => setSelectedId(e.target.value)}
                className={styles.selectDropdown}
            >
                {quizzes.map((quiz) => (
                    <option key={quiz.id} value={quiz.id}>
                        {quiz.name}
                    </option>
                ))}
            </select>
            <button
                type="submit"
                className={styles.submitButton}
                disabled={!selectedId}
            >
                Przejdź do gry
            </button>
        </form>
    );
}