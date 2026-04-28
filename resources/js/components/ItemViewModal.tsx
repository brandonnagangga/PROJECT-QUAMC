import { useEffect, useState, useCallback } from 'react';
import { X, Download, Star, Loader2, CheckCircle2 } from 'lucide-react';

const getCsrf = (): string => {
    const meta = document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement | null;
    if (meta?.content) return meta.content;
    const match = document.cookie.match(/(?:^|;\s*)XSRF-TOKEN=([^;]*)/);
    return match ? decodeURIComponent(match[1]) : '';
};

// Lexical (read-only rendering)
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { HeadingNode, QuoteNode } from '@lexical/rich-text';
import { ListItemNode, ListNode } from '@lexical/list';
import { CodeNode } from '@lexical/code';
import { LinkNode } from '@lexical/link';
import { useRef } from 'react';

interface FileRecord {
    id: number;
    original_filename: string;
    size_formatted: string;
    mime_type: string;
    scan_status: string;
}

interface Props {
    item: { id: number; label: string; ipo_type: string };
    subAreaName: string;
    areaName: string;
    programId: number | null;
    onClose: () => void;
}

const IPO_WEIGHT: Record<string, number> = { input: 0.20, process: 0.30, outcome: 0.50 };

// ── Loads saved content into the read-only editor ────────────────────────────
function LoadContent({ json }: { json: any }) {
    const [editor] = useLexicalComposerContext();
    const loaded = useRef(false);
    useEffect(() => {
        if (loaded.current || !json) return;
        loaded.current = true;
        try {
            // parseEditorState requires a JSON *string*, not a JS object
            const jsonStr = typeof json === 'string' ? json : JSON.stringify(json);
            editor.setEditorState(editor.parseEditorState(jsonStr));
        } catch (e) {
            console.warn('[ItemViewModal] Could not parse editor state:', e);
        }
    }, [editor, json]);
    return null;
}

// ── Main View Modal ──────────────────────────────────────────────────────────

export default function ItemViewModal({ item, subAreaName, areaName, onClose }: Props) {
    const [loading, setLoading]       = useState(true);
    const [rating, setRating]         = useState<number | null>(null);
    const [hoverRating, setHoverRating] = useState<number | null>(null);
    const [files, setFiles]           = useState<FileRecord[]>([]);
    const [contentJson, setContentJson] = useState<any>(null);
    const [contentText, setContentText] = useState<string | null>(null);
    const [status, setStatus]         = useState<string>('draft');
    const [savingRating, setSavingRating] = useState(false);
    const [ratingSaved, setRatingSaved]   = useState(false);
    const [ratingError, setRatingError]   = useState('');

    const ipoLabel  = item.ipo_type.charAt(0).toUpperCase() + item.ipo_type.slice(1);
    const ipoWeight = IPO_WEIGHT[item.ipo_type] ?? 0.20;

    useEffect(() => {
        fetch(`/area-items/${item.id}/response`, {
            headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
        })
            .then(r => r.json())
            .then(d => {
                setRating(d.rating ?? null);
                setFiles(d.files ?? []);
                setContentJson(d.content_json ?? null);
                setContentText(d.content_text ?? null);
                setStatus(d.status ?? 'draft');
            })
            .finally(() => setLoading(false));
    }, [item.id]);

    const saveRating = useCallback(async (newRating: number | null) => {
        setSavingRating(true);
        setRatingError('');
        setRatingSaved(false);
        try {
            const res = await fetch(`/area-items/${item.id}/response`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': getCsrf(),
                    'X-Requested-With': 'XMLHttpRequest',
                    'Accept': 'application/json',
                },
                body: JSON.stringify({ rating: newRating }),
            });
            if (res.ok) {
                setRatingSaved(true);
                setTimeout(() => setRatingSaved(false), 2000);
            } else {
                const data = await res.json().catch(() => ({}));
                setRatingError(data.message ?? 'Could not save rating.');
            }
        } catch {
            setRatingError('Network error.');
        } finally {
            setSavingRating(false);
        }
    }, [item.id]);

    const lexicalConfig = {
        namespace: `view-${item.id}`,
        theme: {
            paragraph: 'editor-paragraph',
            heading: { h1: 'editor-h1', h2: 'editor-h2', h3: 'editor-h3' },
            text: { bold: 'editor-bold', italic: 'editor-italic', underline: 'editor-underline', strikethrough: 'editor-strikethrough' },
            list: { ul: 'editor-ul', ol: 'editor-ol', listitem: 'editor-li', nested: { listitem: 'editor-li-nested' } },
            quote: 'editor-quote',
        },
        nodes: [HeadingNode, QuoteNode, ListNode, ListItemNode, CodeNode, LinkNode],
        onError: (e: Error) => console.error(e),
        editable: false,
    };

    return (
        <>
            <div onClick={onClose} style={{
                position: 'fixed', inset: 0, background: 'rgba(15,31,61,0.5)',
                zIndex: 400, backdropFilter: 'blur(2px)',
            }} />

            <div style={{
                position: 'fixed', top: '50%', left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '96%', maxWidth: 680, maxHeight: '88vh',
                background: '#fff', borderRadius: 16,
                boxShadow: '0 32px 80px rgba(15,31,61,0.22)',
                zIndex: 401, display: 'flex', flexDirection: 'column', overflow: 'hidden',
            }}>
                {/* Header */}
                <div style={{
                    padding: '16px 20px', borderBottom: '1px solid #dde1ed',
                    display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
                    flexShrink: 0,
                }}>
                    <div>
                        <div style={{ fontSize: 11, color: '#8892aa', marginBottom: 2 }}>
                            {areaName} › {subAreaName} › {ipoLabel} — read-only
                        </div>
                        <div style={{ fontSize: 17, fontWeight: 700, color: '#0f1f3d' }}>{item.label}</div>
                    </div>
                    <button onClick={onClose} style={{
                        width: 30, height: 30, borderRadius: 8, border: '1px solid #dde1ed',
                        background: '#f8f9fc', cursor: 'pointer', display: 'flex',
                        alignItems: 'center', justifyContent: 'center',
                    }}>
                        <X size={14} color="#8892aa" />
                    </button>
                </div>

                {/* Body */}
                <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
                    {loading ? (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200 }}>
                            <Loader2 size={24} color="#8892aa" />
                        </div>
                    ) : (
                        <>
                            {/* Narrative */}
                            <div style={{
                                fontSize: 11, fontWeight: 700, color: '#4a5470',
                                textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8,
                            }}>Narrative</div>

                            {contentJson ? (
                                <div style={{
                                    border: '1.5px solid #dde1ed', borderRadius: 8,
                                    padding: '14px 16px', background: '#fafbfe', marginBottom: 16,
                                }}>
                                    <LexicalComposer initialConfig={lexicalConfig}>
                                        <RichTextPlugin
                                            contentEditable={
                                                <ContentEditable style={{
                                                    fontSize: 13.5, lineHeight: 1.65,
                                                    fontFamily: "'Inter', sans-serif",
                                                    color: '#1e2640', outline: 'none',
                                                }} />
                                            }
                                            placeholder={<></>}
                                            ErrorBoundary={LexicalErrorBoundary}
                                        />
                                        <LoadContent json={contentJson} />
                                    </LexicalComposer>
                                </div>
                            ) : contentText ? (
                                <div style={{
                                    border: '1.5px solid #dde1ed', borderRadius: 8,
                                    padding: '14px 16px', background: '#fafbfe', marginBottom: 16,
                                    fontSize: 13.5, lineHeight: 1.65, color: '#1e2640',
                                    fontFamily: "'Inter', sans-serif", whiteSpace: 'pre-wrap',
                                }}>
                                    {contentText}
                                </div>
                            ) : (
                                <div style={{
                                    border: '1.5px dashed #dde1ed', borderRadius: 8,
                                    padding: '20px', color: '#b8bfd4', fontSize: 13,
                                    textAlign: 'center', marginBottom: 16,
                                }}>
                                    No narrative written yet.
                                </div>
                            )}

                            {/* Files */}
                            <div style={{
                                fontSize: 11, fontWeight: 700, color: '#4a5470',
                                textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8,
                            }}>
                                Supporting Evidence ({files.length} file{files.length !== 1 ? 's' : ''})
                            </div>
                            {files.length > 0 ? (
                                <div style={{
                                    border: '1px solid #dde1ed', borderRadius: 8,
                                    overflow: 'hidden', marginBottom: 16,
                                }}>
                                    {files.map(f => {
                                        const ext = f.original_filename.split('.').pop()?.toUpperCase() ?? 'FILE';
                                        return (
                                            <div key={f.id} style={{
                                                display: 'flex', alignItems: 'center', gap: 10,
                                                padding: '8px 12px', borderBottom: '1px solid #f5f5f8',
                                            }}>
                                                <div style={{
                                                    width: 32, height: 32, borderRadius: 6, background: '#e6f1fb',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    fontSize: 8, fontWeight: 800, color: '#185fa5', flexShrink: 0,
                                                }}>{ext}</div>
                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                    <div style={{ fontSize: 12.5, fontWeight: 500, color: '#1e2640', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                        {f.original_filename}
                                                    </div>
                                                    <div style={{ fontSize: 10, color: '#8892aa' }}>{f.size_formatted}</div>
                                                </div>
                                                <a href={`/item-files/${f.id}/download`} style={{
                                                    display: 'flex', alignItems: 'center', padding: '4px 8px',
                                                    borderRadius: 6, border: '1px solid #dde1ed', background: '#f8f9fc',
                                                    color: '#4a5470', textDecoration: 'none',
                                                }}>
                                                    <Download size={12} />
                                                </a>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div style={{
                                    border: '1.5px dashed #dde1ed', borderRadius: 8,
                                    padding: '14px', color: '#b8bfd4', fontSize: 12.5,
                                    textAlign: 'center', marginBottom: 16,
                                }}>No files attached.</div>
                            )}

                            {/* Rating */}
                            <div style={{
                                fontSize: 11, fontWeight: 700, color: '#4a5470',
                                textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8,
                            }}>Rating</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                                {/* Interactive stars */}
                                <div style={{ display: 'flex', gap: 3 }}>
                                    {[1,2,3,4,5].map(n => {
                                        const active = hoverRating !== null ? n <= hoverRating : (rating !== null && n <= rating);
                                        return (
                                            <button
                                                key={n}
                                                type="button"
                                                disabled={savingRating}
                                                onMouseEnter={() => setHoverRating(n)}
                                                onMouseLeave={() => setHoverRating(null)}
                                                onClick={() => {
                                                    const next = rating === n ? null : n;
                                                    setRating(next);
                                                    saveRating(next);
                                                }}
                                                style={{
                                                    background: 'none', border: 'none',
                                                    cursor: savingRating ? 'wait' : 'pointer',
                                                    padding: 2, transition: 'transform 0.1s',
                                                    transform: hoverRating !== null && n <= hoverRating ? 'scale(1.15)' : 'scale(1)',
                                                }}
                                            >
                                                <Star
                                                    size={26}
                                                    fill={active ? '#f59e0b' : 'none'}
                                                    color={active ? '#f59e0b' : '#d1d5db'}
                                                    style={{ transition: 'fill 0.1s, color 0.1s' }}
                                                />
                                            </button>
                                        );
                                    })}
                                </div>

                                {/* Numeric / status display */}
                                <span style={{ fontSize: 13, fontWeight: 600, color: '#0f1f3d' }}>
                                    {rating !== null ? `${rating} / 5` : 'Not rated'}
                                </span>

                                {rating !== null && (
                                    <span style={{
                                        padding: '4px 10px', borderRadius: 8, background: '#f0f2f8',
                                        fontSize: 12, color: '#4a5470',
                                    }}>
                                        {(ipoWeight * 100).toFixed(0)}% × {rating} = <strong>{(rating * ipoWeight).toFixed(2)}</strong>
                                    </span>
                                )}

                                {savingRating && <Loader2 size={14} color="#8892aa" className="animate-spin" />}
                                {ratingSaved && (
                                    <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#059669', fontWeight: 600 }}>
                                        <CheckCircle2 size={13} /> Saved
                                    </span>
                                )}
                                {ratingError && (
                                    <span style={{ fontSize: 11, color: '#dc2626' }}>⚠ {ratingError}</span>
                                )}
                            </div>
                            <div style={{ fontSize: 11, color: '#b8bfd4', marginTop: 4 }}>Click a star to rate. Click the same star to clear.</div>
                        </>
                    )}
                </div>

                {/* Footer */}
                <div style={{
                    padding: '12px 20px', borderTop: '1px solid #dde1ed',
                    display: 'flex', justifyContent: 'flex-end', background: '#fafbfe', flexShrink: 0,
                }}>
                    <button onClick={onClose} style={{
                        padding: '10px 24px', borderRadius: 8, border: '1px solid #dde1ed',
                        background: '#0f1f3d', cursor: 'pointer', fontSize: 13,
                        fontWeight: 700, color: '#c9a84c', fontFamily: "'Inter', sans-serif",
                    }}>Close</button>
                </div>
            </div>

            <style>{`
                .editor-paragraph { margin: 0 0 8px; }
                .editor-h1 { font-size: 1.5em; font-weight: 800; color: #0f1f3d; margin: 12px 0 6px; }
                .editor-h2 { font-size: 1.25em; font-weight: 700; color: #0f1f3d; margin: 10px 0 4px; }
                .editor-h3 { font-size: 1.1em;  font-weight: 600; color: #0f1f3d; margin: 8px 0 4px; }
                .editor-bold { font-weight: 700; }
                .editor-italic { font-style: italic; }
                .editor-underline { text-decoration: underline; }
                .editor-strikethrough { text-decoration: line-through; }
                .editor-ul { margin: 4px 0 4px 20px; list-style-type: disc; }
                .editor-ol { margin: 4px 0 4px 20px; list-style-type: decimal; }
                .editor-li { margin: 2px 0; }
                .editor-quote { border-left: 3px solid #c9d4f0; margin: 8px 0; padding: 4px 12px; color: #4a5470; font-style: italic; }
            `}</style>
        </>
    );
}
