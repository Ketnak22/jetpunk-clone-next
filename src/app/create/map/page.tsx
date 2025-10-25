'use client';

import { useRef, useState, useEffect, ChangeEvent } from "react";
import Dropzone from 'react-dropzone';
import styles from './page.module.css';
import { map } from "zod";

interface PathState {
    originalId: string;
    originalFill: string;
    customName: string;
    isExcluded: boolean;
}

type IdPathMapping = {
    [key: string]: string;
}

export default function Page() {
    const containerRef = useRef<HTMLDivElement>(null);
    const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

    const [svgContent, setSvgContent] = useState<string | null>(null);
    const [originalSvgContent, setOriginalSvgContent] = useState<string | null>(null);

    // Unified state for all path-related data (fills, ids, user inputs)
    const [pathStates, setPathStates] = useState<PathState[]>([]);
    const [mapName, setMapName] = useState<string>('');
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

    const handleDrop = (acceptedFiles: File[]) => {
        const file = acceptedFiles[0];
        if (file && file.type === 'image/svg+xml') {
            const reader = new FileReader();
            reader.onload = (e) => {
                const text = e.target?.result as string;
                setSvgContent(text);
                setOriginalSvgContent(text);

                try {
                    const parser = new DOMParser();
                    const doc = parser.parseFromString(text, 'image/svg+xml');
                    const pathNodes = Array.from(doc.querySelectorAll('path'));

                    // Extract initial state from DOM nodes once
                    const initialStates: PathState[] = pathNodes.map(path => ({
                        originalId: path.id || '',
                        originalFill: path.style.fill || '',
                        customName: '',
                        isExcluded: false
                    }));
                    setPathStates(initialStates);
                } catch (err) {
                    console.error("Error parsing SVG:", err);
                    setPathStates([]);
                }
            };
            reader.readAsText(file);
        }
    };

    // Synchronize SVG DOM with React state for highlighting and interactions
    useEffect(() => {
        if (!containerRef.current) return;
        const svgPaths = Array.from(containerRef.current.querySelectorAll('path'));

        svgPaths.forEach((path, idx) => {
            const state = pathStates[idx];
            if (!state) return;

            path.style.transition = 'fill 0.2s, stroke 0.2s';

            // Apply fill based on hover state
            if (hoveredIndex === idx) {
                path.style.fill = '#ffe5b4';
            } else {
                path.style.fill = state.originalFill || '';
            }

            // Attach event listeners to sync with React state
            path.onclick = () => {
                inputRefs.current[idx]?.focus();
                setHoveredIndex(idx);
            };
            path.onmouseenter = () => setHoveredIndex(idx);
            path.onmouseleave = () => setHoveredIndex(null);
        });

        // Cleanup listeners
        return () => {
            svgPaths.forEach(path => {
                path.onclick = null;
                path.onmouseenter = null;
                path.onmouseleave = null;
            });
        }
    }, [hoveredIndex, pathStates, svgContent]);

    const handleUploadClick = async () => {
        if (!originalSvgContent || !mapName) return;

        // Re-create the blob from the original content
        const svgBlob = new Blob([originalSvgContent], { type: 'image/svg+xml' });

        // Generate mapping from state instead of querying DOM inputs
        const pathIdMapping: IdPathMapping = {};
        pathStates.forEach(state => {
            if (!state.isExcluded && state.originalId) {
                pathIdMapping[state.originalId] = state.customName || state.originalId;
            }
        });

        const formData = new FormData();
        formData.append('svg', svgBlob, 'map.svg');
        formData.append('json', new Blob([JSON.stringify(pathIdMapping)], { type: 'application/json' }), 'data.json');
        formData.append('name', mapName);

        try {
            const response = await fetch('/api/upload/map', { method: 'POST', body: formData });
            if (response.ok) {
                console.log('Map uploaded successfully');
                window.location.href = '/';
            } else {
                const errorText = await response.text();
                console.error(`Error uploading map: ${response.status} - ${errorText}`);
            }
        } catch (error) {
            console.error('Error uploading map:', error);
        }
    };

    const handleInputChange = (index: number, value: string) => {
        setPathStates(prev => {
            const newStates = [...prev];
            newStates[index] = { ...newStates[index], customName: value };
            return newStates;
        });
    };

    const togglePathExclusion = (index: number) => {
        setPathStates(prev => {
            const newStates = [...prev];
            const current = newStates[index];
            newStates[index] = {
                ...current,
                isExcluded: !current.isExcluded,
                // Clear custom name if excluded, akin to original clearing value
                customName: !current.isExcluded ? '' : current.customName
            };
            return newStates;
        });
    };

    const areAllPathsExcluded = pathStates.length > 0 && pathStates.every(state => state.isExcluded);

    const toggleAllPathExclusion = () => {
        const someExcluded = pathStates.some(state => state.isExcluded);
        setPathStates(prev => prev.map(state => ({
            ...state,
            isExcluded: !someExcluded,
            customName: !someExcluded ? '' : state.customName
        })));
    };


    return (
        <div className={styles['uploader-container']}>
            {!svgContent &&
                <Dropzone accept={{ 'image/svg+xml': ['.svg'] }} onDrop={handleDrop}>
                    {({ getRootProps, getInputProps }) => (
                        <section>
                            <div {...getRootProps()} className={styles['uploader-dropzone']}>
                                <input {...getInputProps()} />
                                <p>Przeciągnij i upuść plik SVG tutaj lub kliknij, aby wybrać plik</p>
                            </div>
                        </section>
                    )}
                </Dropzone>
            }
            {svgContent && (
                <>
                    <div className={styles['uploader-svg-preview']}>
                        <div
                            ref={containerRef}
                            dangerouslySetInnerHTML={{ __html: svgContent }}
                        />
                    </div>


                    <div className={styles['uploader-input-list-wrapper']}>
                        <div className={styles['uploader-interaction']}>
                            <button
                                className={styles['uploader-input-btn']}
                                style={{ backgroundColor: areAllPathsExcluded ? '#f0ad4e' : '#ff4d4f' }}
                                onClick={toggleAllPathExclusion}
                            >
                                {areAllPathsExcluded ? 'Zawieraj wszystko' : 'Wyłącz wszystko'}
                            </button>

                            <div className={styles['uploader-input-list']}>
                                {pathStates.map((state, i) => (
                                    <div className={styles['uploader-input']} key={i} 
                                        onMouseEnter={() => { if (state.isExcluded) setHoveredIndex(i)}}
                                        onMouseLeave={() => { if (state.isExcluded) setHoveredIndex(null)}}
                                    >
                                        <input
                                            type="text"
                                            minLength={1}
                                            maxLength={50}
                                            placeholder={state.originalId || ''}
                                            value={state.customName}
                                            disabled={state.isExcluded}
                                            ref={el => { inputRefs.current[i] = el; }}
                                            onChange={(e) => handleInputChange(i, e.target.value)}
                                            onFocus={() => setHoveredIndex(i)}                                            
                                        />
                                        <button
                                            className={styles['uploader-input-btn']}
                                            style={{ backgroundColor: state.isExcluded ? '#f0ad4e' : '#ff4d4f' }}
                                            onClick={() => togglePathExclusion(i)}
                                        >
                                            {state.isExcluded ? '↺' : 'X'}
                                        </button>
                                    </div>
                                ))}
                            </div>

                        </div>

                        <div className={styles['uploader-down-div']}>
                            <input
                                type='text'
                                placeholder='Wpisz nazwę mapy...'
                                className={styles['uploader-name-input']}
                                value={mapName}
                                onChange={(e) => setMapName(e.target.value)}
                            />
                            <button className={styles['uploader-btn']} onClick={handleUploadClick}>Wyślij</button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}