"use client";

import { useEffect, useRef, useState } from 'react';
import styles from './MapPlayer.module.css'

import FetchedGameData from '@/app/types/FetchedGameData';
import MapJSONData from '@/app/types/MapJSONData';
import MapData from '@/app/types/MapData';

export default function MapPlayer({ mapId }: { mapId: string }) {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    const [svgContent, setSvgContent] = useState<string | null>(null);
    const svgContainerRef = useRef<HTMLDivElement | null>(null);
    const [mapData, setMapData] = useState<MapData | null>(null);

    useEffect(() => {
        const controller = new AbortController();
        
        (async () => {
            try {
                const res = await fetch(`/api/game/${encodeURIComponent(mapId)}`, {
                    cache: 'no-store',
                    signal: controller.signal,
                });

                if (!res.ok) {
                    throw new Error(res.status === 404 ? 'Map not found' : 'Failed to fetch map');
                }

                const data: FetchedGameData = await res.json();
                const jsonData = JSON.parse(data.jsonData) as MapJSONData;
                
                if (!jsonData){
                    throw new Error('Invalid map data');
                }

                if (!data.svgData) {
                    throw new Error('SVG data is missing');
                }

                setMapData({
                    id: mapId,
                    name: data.name,
                    svgData: data.svgData,
                    jsonData: jsonData,
                    createdAt: typeof data.createdAt === "number" ? new Date(data.createdAt) : data.createdAt,
                });
                setSvgContent(data.svgData);
                setLoading(false);
            } catch (err: any) {
                if (err.name !== 'AbortError') {
                    setError(err.message);
                    setLoading(false);
                }
            }
        })();

        return () => {
            controller.abort();
        };
    }, [mapId]);

    if (loading) return <div className={styles["status-message"]}>Loading…</div>;
  if (error) return <div className={styles["status-message error"]}>{error}</div>;
  if (!mapData) return <div className={styles["status-message"]}>Map not available.</div>;

  const handleAnswerInput = (e: React.ChangeEvent<HTMLInputElement>) => {};

    return (
        <div className={styles['map-player-container']}>
            <h1 className={styles["quiz-question"]}>{mapData.name}</h1>
            <input type="text" placeholder="Wpisz odpowiedź..." className={styles['answer-input']} onChange={handleAnswerInput}/>

            <div className={styles['svg-container']}>
                <div ref={svgContainerRef} dangerouslySetInnerHTML={{ __html: svgContent || '' }} />
            </div>
        </div>
    );
}