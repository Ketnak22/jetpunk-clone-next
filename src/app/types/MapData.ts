import MapJSONData from "./MapJSONData";

interface MapData {
    id: string;
    name: string;
    svgData: string;
    jsonData: MapJSONData;
    createdAt: number | Date;
}

export default MapData;