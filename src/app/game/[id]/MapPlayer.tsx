"use client";

import { useEffect, useRef, useState } from 'react';
import styles from './MapPlayer.module.css'

import FetchedGameData from '@/app/types/FetchedGameData';
import MapData from '@/app/types/MapData';
import MapJSONData from '@/app/types/MapJSONData';

import removePolishChars from '@/app/utils/removePolishChars';

import Image from 'next/image';

export default function MapPlayer({ mapId }: { mapId: string }) {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [svgContent, setSvgContent] = useState<string | null>(null);
    const svgContainerRef = useRef<HTMLDivElement | null>(null);
    const [mapData, setMapData] = useState<MapData | null>(null);
    const [points, setPoints] = useState<number>(0);
    const [maxPoints, setMaxPoints] = useState<number>(0);
    const [answeredPoints, setAnsweredPoints] = useState<Set<string>>(new Set());
    const [showResults, setShowResults] = useState<boolean>(false);
    const [highlightedPathId, setHighlightedPathId] = useState<string | null>(null);
    const [pathFills, setPathFills] = useState<Record<string, string>>({});
    const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

    const [overlayVisible, setOverlayVisible] = useState(false);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            setTooltipPosition({ x: e.clientX, y: e.clientY });
        };

        window.addEventListener('mousemove', handleMouseMove);

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
        };
    }, []);

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

                if (!jsonData) {
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
                setMaxPoints(Object.keys(jsonData).length);
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

    useEffect(() => {
        if (!svgContent || !svgContainerRef.current) return;

        svgContainerRef.current.innerHTML = '';

        const parser = new DOMParser();
        const svgDoc = parser.parseFromString(svgContent, 'image/svg+xml');
        const svgElement = svgDoc.documentElement;

        svgContainerRef.current.appendChild(svgElement);

        const paths = svgElement.querySelectorAll<SVGPathElement>('path');

        const handleMouseEnter = (e: MouseEvent) => {
            const target = e.target as SVGPathElement;
            const id = target.id;
            setHighlightedPathId(id);
        };

        const handleMouseLeave = () => {
            setHighlightedPathId(null);
        };

        paths.forEach(path => {
            path.style.transition = 'fill 0.3s ease';
            const pathId = path.id;
            if (pathFills[pathId]) {
                path.style.fill = pathFills[pathId];
            }

            path.addEventListener('mouseenter', handleMouseEnter);
            path.addEventListener('mouseleave', handleMouseLeave);
        });

        return () => {
            paths.forEach(path => {
                path.removeEventListener('mouseenter', handleMouseEnter);
                path.removeEventListener('mouseleave', handleMouseLeave);
            });
        };
    }, [svgContent, pathFills]);

    if (loading) return <div className={styles["status-message"]}>Loading…</div>;
    if (error) return <div className={styles["status-message error"]}>{error}</div>;
    if (!mapData) return <div className={styles["status-message"]}>Map not available.</div>;

    const handleAnswerInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;

        for (const pathId in mapData.jsonData) {
            const answer = mapData.jsonData[pathId];

            const answerNormalized = removePolishChars(answer).toLowerCase();
            const valueNormalized = removePolishChars(value).toLowerCase();
            if (answerNormalized === valueNormalized && !answeredPoints.has(pathId)) {
                e.target.value = "";
                setAnsweredPoints(prev => {
                    const updated = new Set(prev).add(pathId);
                    setPoints(updated.size);
                    if (updated.size === maxPoints) {
                        setShowResults(true);
                    }
                    return updated;
                });
                setPathFills(prev => ({ ...prev, [pathId]: "green" }));
                break;
            }
        }
    };

    const handleGiveUp = () => {
        const newPathFills = { ...pathFills };
        for (const pathId in mapData.jsonData) {
            if (!answeredPoints.has(pathId)) {
                newPathFills[pathId] = "red";
            }
        }
        setPathFills(newPathFills);
        setShowResults(true);

        setOverlayVisible(true);
    }

    return (
        <>
            <div className={styles['map-player-container']}>
                <h1 className={styles["quiz-question"]}>{mapData.name}</h1>

                <div className={styles['controls-card']}>
                    <div className={styles['points-display']}>
                        <span>Punkty</span>
                        <p>{points} / {maxPoints}</p>
                    </div>

                    <div className={styles['quiz-interact-div']}>
                        {!showResults ? (
                            <>
                                <input
                                    type="text"
                                    placeholder="Wpisz odpowiedź..."
                                    className={styles['answer-input']}
                                    onChange={handleAnswerInput}
                                    autoFocus
                                />
                                <button className={styles['give-up-btn']} onClick={handleGiveUp}>
                                    Poddaj się
                                </button>
                            </>
                        ) : (
                            <div className={styles['results']}>
                                <h2>Koniec!</h2>
                                <p>Twój ostateczny wynik to {points} na {maxPoints} punktów.</p>
                            </div>
                        )}
                    </div>
                </div>

                <div ref={svgContainerRef} className={styles['svg-container']} />

                {(showResults || (highlightedPathId && answeredPoints.has(highlightedPathId))) &&
                    highlightedPathId &&
                    mapData.jsonData[highlightedPathId] && (
                        <div
                            className={styles['tooltip']}
                            style={{
                                left: `${tooltipPosition.x}px`,
                                top: `${tooltipPosition.y}px`,
                                color: pathFills[highlightedPathId] || 'white'
                            }}
                        >
                            {mapData.jsonData[highlightedPathId]}
                        </div>
                    )}
            </div>
            {overlayVisible &&
                <div className={styles.overlay}>
                    <div className={styles['give-up-message']}>
                        <p>Wojciech G. 14 miesiące temu·185.241.*.*</p>
                        <p>Osoba która właśnie się poddała widać że jest głupim i nie do edukowanym dzieciakiem.Powiedź mi po co to robisz co ci do da robienie takich rzeczy? zdradzę ci sekret mam 13 lat i jestem od ciebie mądrzejszy a zakładam że jesteś starszy mimo to że powiedziałem że jesteś dzieckiem.Zapewne mentalnie jesteś bo żeby podstawowej wiedzy geograficznej nie znać to trzeba być serio głupim. do tego jeszcze swoją głupotą wyzywasz twórce. BRAWO rozumu. wyobraź sobie że tworzyłem te mapę bardzo długo i ucieszyłem się ukończyłem. i założę się że grając w ten quiz i tak nie myślałeś o tym jaka jest jakość. Więc weź się ogarnij bo robienie takich głupich rzeczy psuje twoją osobę. A jak taki mądry jesteś to prosze sam taką mapę wrzuć do jakiejś strony żeby ludzie mogli grać i zobaczymy jaką ty będziesz miał jakość. In case i don't see ya . Good afternoon, Good evening and good night</p>
                        <Image src="/idiota.png" width={605} height={413} alt="Facepalm" />
                        <button className={styles.closeOverlayBtn} onClick={() => setOverlayVisible(false)}>Zamknij komunikat</button>
                    </div>
                </div>
            }
        </>
    );
}