import QuizType from "./QuizType";

interface QuizJSONData {
    question: string;
    answers: string[];
    keys?: string[];
    headers?: string[];
}

type MapJSONData = Record<string, string>;  

interface FetchedGameData {
    type: QuizType;
    name: string;
    jsonData: string;
    svgData?: string | null;
    createdAt: number | Date;
}

export type { FetchedGameData, QuizJSONData, MapJSONData };