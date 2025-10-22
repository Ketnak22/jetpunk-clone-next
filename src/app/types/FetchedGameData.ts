import QuizType from "./QuizType";
import QuizJSONData from "./QuizJSONData";
import MapJSONData from "./MapJSONData";

interface FetchedGameData {
    type: QuizType;
    name: string;
    jsonData: string;
    svgData?: string | null;
    createdAt: number | Date;
}

export default FetchedGameData;