type QuizData = {
  id?: string;
  question?: string;
  type: 'quiz' | 'matchingQuiz';
  answers: string[];
  keys?: string[];
  headers?: string[];
  createdAt?: number | Date;
};

export default QuizData;