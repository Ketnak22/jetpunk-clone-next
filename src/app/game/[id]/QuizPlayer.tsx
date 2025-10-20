"use client";

import { useState, useEffect } from "react";

import QuizData from "@/app/types/QuizData";

export default function QuizPlayer({ id }: { id: string }) {
  const [quiz, setQuiz] = useState<QuizData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // fetch quiz on mount
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch(`/api/quiz/${encodeURIComponent(id)}`, { cache: 'no-store' });
        if (!res.ok) {
          if (res.status === 404) throw new Error('Quiz not found');
          throw new Error('Failed to fetch quiz');
        }

        const json = await res.json() as QuizData;
        // convert createdAt millis back to Date for client-side use if present
        if (json?.createdAt && typeof json.createdAt === 'number') {
          json.createdAt = new Date(json.createdAt);
        }
        setQuiz(json);
      } catch (err: any) {
        console.error(err);
        if (mounted) setError(err?.message ?? 'Unknown error');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [id]);


  if (loading) return <div>Loading…</div>;
  if (error) return <div>{error}</div>;
  if (!quiz) return <div>Quiz not available.</div>;

  return (
    <div>
          <pre>{JSON.stringify(quiz, null, 2)}</pre>
    </div>
  );
}
