import QuizType from "./QuizType";

interface QuizJSONData {
    question: string;
    answers: string[];
    keys?: string[];
}

type MapJSONData = Record<string, string>;  

interface FetchedGameData {
    id: string;
    type: QuizType;
    name: string;
    jsonData: MapJSONData | QuizJSONData;
    svgData?: string | null;
    createdAt: number | Date;
}

export default FetchedGameData;