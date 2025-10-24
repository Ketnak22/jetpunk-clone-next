'use client';

import { useRef, useState, useEffect } from "react";

import Dropzone from 'react-dropzone';
import styles from './page.module.css';

interface PathStyle {
    fill?: string;
}

type IdPathMapping = {
    [key: string]: string;
}

export default function Home() {
    const containerRef = useRef<HTMLDivElement>(null);
    const inputRefs = useRef<Array<HTMLInputElement | null>>([]);
    const buttonRefs = useRef<Array<HTMLButtonElement | null>>([]);
    const nameInputRef = useRef<HTMLInputElement | null>(null);

    const [svgContent, setSvgContent] = useState<string | null>(null);
    const [originalSvgContent, setOriginalSvgContent] = useState<string | null>(null);
    const [initialPathStyle, setInitialPathStyle] = useState<PathStyle[]>([]);
    const [paths, setPaths] = useState<SVGPathElement[]>([]);

    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

    const handleDrop = (acceptedFiles: File[]) => {
        const file = acceptedFiles[0];
        if (file && file.type === 'image/svg+xml') {
            const reader = new FileReader();
            reader.onload = (e) => {
                const text = e.target?.result as string;
                setSvgContent(text);
                setOriginalSvgContent(text); // Save original SVG for later use

                // Parse SVG and extract path elements
                try {
                    const parser = new DOMParser();
                    const doc = parser.parseFromString(text, 'image/svg+xml');
                    const pathNodes = doc.querySelectorAll('path');
                    setPaths(Array.from(pathNodes) as SVGPathElement[]);

                    setInitialPathStyle(Array.from(pathNodes).map(path => ({
                        fill: path.style.fill || '',
                    })));
                } catch (err) {
                    setPaths([]);
                    setInitialPathStyle([]);
                }
            };
            reader.readAsText(file);
        } else {
            setSvgContent(null);
            setPaths([]);
            setInitialPathStyle([]);
            setOriginalSvgContent(null);
        }
    };

    // Highlight path on hover and handle click-to-focus
    useEffect(() => {
        if (!containerRef.current) return;
        const svgPaths = Array.from(containerRef.current.querySelectorAll('path'));
        svgPaths.forEach((path, idx) => {
            path.style.transition = 'fill 0.2s, stroke 0.2s';
            if (hoveredIndex === idx) {
                path.style.fill = '#ffe5b4';
            } else {
                path.style.fill = initialPathStyle[idx]?.fill || '';
            }
            path.onclick = null;
            path.onclick = () => {
                inputRefs.current[idx]?.focus();
                svgPaths.forEach((p, j) => {
                    p.style.fill = initialPathStyle[j]?.fill || '';
                });
                path.style.fill = '#ffe5b4';
            };
        });
    }, [hoveredIndex, svgContent, paths, initialPathStyle]);

    const handleUploadClick = () => {
        if (!originalSvgContent) return;
        if (!nameInputRef.current?.value) return;

        // Parse original SVG
        const parser = new DOMParser();
        const doc = parser.parseFromString(originalSvgContent, 'image/svg+xml');
        const pathNodes = doc.querySelectorAll('path');

        // Serialize SVG
        const serializer = new XMLSerializer();
        const newSvg = serializer.serializeToString(doc.documentElement);
        const svgBlob = new Blob([newSvg], { type: 'image/svg+xml' });

        // Create mapping of original ids to new ids
        const pathIdMapping: IdPathMapping = {};

        // Replace ids with input values or empty string when disabled
        pathNodes.forEach((path, i) => {
            if (inputRefs.current[i]?.disabled) return;
            if (path.id) {
                pathIdMapping[path.id] = inputRefs.current[i]?.value || path.id;
            }
        });

        const formData = new FormData();
        formData.append('svg', svgBlob, 'map.svg');
        const jsonData = pathIdMapping ? JSON.stringify(pathIdMapping) : '{}';
        const jsonBlob = new Blob([jsonData], { type: 'application/json' });
        formData.append('json', jsonBlob, 'data.json');
        formData.append('name', nameInputRef.current.value);

        fetch('/api/upload/map', {
            method: 'POST',
            body: formData,
        }).then(response => {
            if (response.status === 200) {
                console.log('Map uploaded successfully');

                window.location.href = '/';
            } else {
                response.text().then(errorText => {
                    console.error(`Error uploading map: ${response.status} - ${errorText}`);
                });
            }
        }).catch(error => {
            console.error('Error uploading map:', error);
        })

    };

    const handleRemoveClick = (index: number, pathId: string) => {
        if (inputRefs.current[index]) {
            if (inputRefs.current[index]!.disabled) {
                inputRefs.current[index]!.disabled = false;

                buttonRefs.current[index]!.textContent = 'X';
                buttonRefs.current[index]!.style.backgroundColor = '#ff4d4f'; // light red
            } else {
                inputRefs.current[index]!.disabled = true;

                inputRefs.current[index]!.value = '';
                inputRefs.current[index]!.placeholder = pathId || '';

                buttonRefs.current[index]!.textContent = '↺';
                buttonRefs.current[index]!.style.backgroundColor = '#f0ad4e'; // light orange
            }
        }
        const updatedPaths = [...paths];
        updatedPaths[index].id = '';
        setPaths(updatedPaths);
    }
    return (
        <div className={styles['uploader-container']}>
            {!svgContent && paths.length === 0 &&
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
            {svgContent && paths.length > 0 && (
                <>
                    <div className={styles['uploader-svg-preview']}>
                        <div
                            ref={containerRef}
                            dangerouslySetInnerHTML={{ __html: svgContent }} // Load SVG into HTML
                        />
                    </div>

                    <div className={styles['uploader-interaction']}>
                        <div className={styles['uploader-input-list']}>
                            {paths.map((path: SVGPathElement, i: number) => (
                                <div className={styles['uploader-input']} key={i}>
                                    <input
                                        type="text"
                                        minLength={1}
                                        maxLength={50}
                                        placeholder={path.id || ''}
                                        ref={el => { inputRefs.current[i] = el; }}
                                        onFocus={() => setHoveredIndex(i)}
                                        onMouseEnter={() => setHoveredIndex(i)}
                                    />
                                    <button
                                        className={styles['uploader-input-btn']}
                                        ref={el => { buttonRefs.current[i] = el }}
                                        onClick={() => handleRemoveClick(i, path.id)}>X</button>
                                </div>
                            ))}
                        </div>

                        <div className={styles['uploader-down-div']}>
                            <input
                                type='text'
                                ref={nameInputRef}
                                placeholder='Wpisz nazwę mapy...'
                                className={styles['uploader-name-input']}
                            />
                            <button className={styles['uploader-btn']} onClick={handleUploadClick}>Wyślij</button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}