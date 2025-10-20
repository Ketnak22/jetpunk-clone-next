// Retrieve the quiz type first to decide which component to render

import { incrementQuizViewCount, getQuizTypeById } from "@/app/lib/firebase";
import { notFound } from "next/navigation";
import QuizPlayer from "./QuizPlayer";

import QuizType from "@/app/types/QuizType";

let quizType: QuizType | null = null;

export default async function Page({ params }: { params: { id: string } }) {
  const { id } = await params;

  try {
    const result = await getQuizTypeById(id);
    if (!result) return notFound();
    
    quizType = result;
  } catch (err) {
    console.error('Error fetching quiz for existence check:', err);
    return notFound();
  }

  try {
    await incrementQuizViewCount(id);
  } catch (err) {
    console.error('Error incrementing view count:', err);
  }

  return <>
    {(quizType === 'quiz' || quizType === "matchingQuiz") &&
        <QuizPlayer id={id} />
    }
  </>;
  
}