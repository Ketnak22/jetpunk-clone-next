type FetchedQuizData = {
  id?: string;
  question?: string;
  type: 'map';
  svgData: string;
  jsonData: Record<string, string>;
  createdAt?: number | Date;
};