import { useEffect, useState, useRef, useCallback } from 'react';
import { X, Upload, Trash2, Download, Star, CheckCircle2, FileText, Loader2 } from 'lucide-react';

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $setBlocksType } from '@lexical/selection';
import { INSERT_ORDERED_LIST_COMMAND, INSERT_UNORDERED_LIST_COMMAND } from '@lexical/list';
import { $createHeadingNode, $createQuoteNode, HeadingNode, QuoteNode } from '@lexical/rich-text';
import { ListItemNode, ListNode } from '@lexical/list';
import { CodeNode } from '@lexical/code';
import { LinkNode } from '@lexical/link';
import {
    $createParagraphNode,
    $createTextNode,
    $getRoot,
    $getSelection,
    $isRangeSelection,
    FORMAT_TEXT_COMMAND,
    REDO_COMMAND,
    UNDO_COMMAND,
} from 'lexical';

// ── Types ────────────────────────────────────────────────────────────────────

interface FileRecord {
    id: number;
    original_filename: string;
    file_size_bytes: number;
    size_formatted: string;
    mime_type: string;
    caption?: string | null;
    scan_status: string;
}

interface ItemData {
    id: number;
    label: string;
    ipo_type: string;
}

interface Props {
    item: ItemData;
    subAreaName: string;
    areaName: string;
    programId: number | null;
    onClose: () => void;
}

// ── IPO weight label ─────────────────────────────────────────────────────────
const IPO_WEIGHT: Record<string, number> = { input: 0.20, process: 0.30, outcome: 0.50 };

// ── CSRF helper – prefers meta tag (added to app.blade.php), falls back to cookie ─────
const getCsrf = (): string => {
    // 1. Meta tag (most reliable — set by Blade)
    const meta = document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement | null;
    if (meta?.content) return meta.content;
    // 2. Cookie fallback (XSRF-TOKEN set by Laravel)
    const match = document.cookie.match(/(?:^|;\s*)XSRF-TOKEN=([^;]*)/);
    return match ? decodeURIComponent(match[1]) : '';
};

// ── Toolbar Button ───────────────────────────────────────────────────────────
const getXsrfCookie = (): string => {
    const match = document.cookie.match(/(?:^|;\s*)XSRF-TOKEN=([^;]*)/);
    return match ? decodeURIComponent(match[1]) : '';
};

const csrfHeaders = (): Record<string, string> => {
    const token = getCsrf();
    const xsrf = getXsrfCookie();

    return {
        ...(token ? { 'X-CSRF-TOKEN': token } : {}),
        ...(xsrf ? { 'X-XSRF-TOKEN': xsrf } : {}),
        'X-Requested-With': 'XMLHttpRequest',
        'Accept': 'application/json',
    };
};

function ToolbarBtn({ active, onClick, title, children }: {
    active?: boolean; onClick: () => void; title: string; children: React.ReactNode;
}) {
    return (
        <button
            type="button"
            onMouseDown={e => { e.preventDefault(); onClick(); }}
            title={title}
            style={{
                padding: '4px 8px', borderRadius: 5, border: 'none',
                background: active ? '#0f1f3d' : 'transparent',
                color: active ? '#c9a84c' : '#4a5470',
                cursor: 'pointer', fontSize: 12, fontWeight: 600,
                transition: 'background 0.12s',
            }}
        >
            {children}
        </button>
    );
}

// ── Toolbar ──────────────────────────────────────────────────────────────────
function EditorToolbar() {
    const [editor] = useLexicalComposerContext();
    const [formats, setFormats] = useState({ bold: false, italic: false, underline: false, strikethrough: false });

    useEffect(() => {
        return editor.registerUpdateListener(({ editorState }) => {
            editorState.read(() => {
                const sel = $getSelection();
                if ($isRangeSelection(sel)) {
                    setFormats({
                        bold: sel.hasFormat('bold'),
                        italic: sel.hasFormat('italic'),
                        underline: sel.hasFormat('underline'),
                        strikethrough: sel.hasFormat('strikethrough'),
                    });
                }
            });
        });
    }, [editor]);

    const formatText = (f: 'bold' | 'italic' | 'underline' | 'strikethrough') =>
        editor.dispatchCommand(FORMAT_TEXT_COMMAND, f);

    const insertList = (type: 'bullet' | 'number') => {
        editor.dispatchCommand(
            type === 'bullet' ? INSERT_UNORDERED_LIST_COMMAND : INSERT_ORDERED_LIST_COMMAND,
            undefined
        );
    };

    const setHeading = (tag: 'h1' | 'h2' | 'h3') => {
        editor.update(() => {
            const sel = $getSelection();
            if ($isRangeSelection(sel)) {
                $setBlocksType(sel, () => $createHeadingNode(tag));
            }
        });
    };

    const setQuote = () => {
        editor.update(() => {
            const sel = $getSelection();
            if ($isRangeSelection(sel)) {
                $setBlocksType(sel, () => $createQuoteNode());
            }
        });
    };

    const setParagraph = () => {
        editor.update(() => {
            const sel = $getSelection();
            if ($isRangeSelection(sel)) {
                $setBlocksType(sel, () => $createParagraphNode());
            }
        });
    };

    const divider = <span style={{ width: 1, height: 16, background: '#dde1ed', margin: '0 4px', flexShrink: 0 }} />;

    return (
        <div style={{
            display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap',
            padding: '6px 10px', background: '#f8f9fc',
            borderBottom: '1px solid #dde1ed', borderRadius: '8px 8px 0 0',
        }}>
            <ToolbarBtn active={formats.bold}          onClick={() => formatText('bold')}          title="Bold (Ctrl+B)"><b>B</b></ToolbarBtn>
            <ToolbarBtn active={formats.italic}        onClick={() => formatText('italic')}        title="Italic (Ctrl+I)"><i>I</i></ToolbarBtn>
            <ToolbarBtn active={formats.underline}     onClick={() => formatText('underline')}     title="Underline (Ctrl+U)"><u>U</u></ToolbarBtn>
            <ToolbarBtn active={formats.strikethrough} onClick={() => formatText('strikethrough')} title="Strikethrough"><s>S</s></ToolbarBtn>
            {divider}
            <ToolbarBtn onClick={() => insertList('bullet')} title="Bullet list">• List</ToolbarBtn>
            <ToolbarBtn onClick={() => insertList('number')} title="Numbered list">1. List</ToolbarBtn>
            {divider}
            <ToolbarBtn onClick={() => setHeading('h1')} title="Heading 1">H1</ToolbarBtn>
            <ToolbarBtn onClick={() => setHeading('h2')} title="Heading 2">H2</ToolbarBtn>
            <ToolbarBtn onClick={() => setHeading('h3')} title="Heading 3">H3</ToolbarBtn>
            <ToolbarBtn onClick={setQuote}     title="Block quote">"</ToolbarBtn>
            <ToolbarBtn onClick={setParagraph} title="Normal text">¶</ToolbarBtn>
            {divider}
            <ToolbarBtn onClick={() => editor.dispatchCommand(UNDO_COMMAND, undefined)} title="Undo">↩</ToolbarBtn>
            <ToolbarBtn onClick={() => editor.dispatchCommand(REDO_COMMAND, undefined)} title="Redo">↪</ToolbarBtn>
        </div>
    );
}

// ── Initial state loader ─────────────────────────────────────────────────────

function LoadInitialContent({ initialJson }: { initialJson: any }) {
    const [editor] = useLexicalComposerContext();
    const loaded = useRef(false);

    useEffect(() => {
        if (loaded.current || !initialJson) return;
        loaded.current = true;
        try {
            const jsonString = typeof initialJson === 'string'
                ? initialJson
                : JSON.stringify(initialJson);
            const editorState = editor.parseEditorState(jsonString);
            editor.setEditorState(editorState);
        } catch (e) {
            console.warn('[ItemEditModal] Could not parse saved editor state:', e);
        }
    }, [editor, initialJson]);

    return null;
}

// ── Fallback: populate editor from plain content_text when no JSON exists ──────
function LoadInitialText({ text }: { text: string }) {
    const [editor] = useLexicalComposerContext();
    const loaded = useRef(false);

    useEffect(() => {
        if (loaded.current || !text) return;
        loaded.current = true;
        editor.update(() => {
            const root = $getRoot();
            root.clear();
            // Split on newlines to create multiple paragraphs
            text.split('\n').forEach(line => {
                const para = $createParagraphNode();
                if (line.trim()) para.append($createTextNode(line));
                root.append(para);
            });
        });
    }, [editor, text]);

    return null;
}

// ── File item row ─────────────────────────────────────────────────────────────

function FileRow({
    file,
    onCaptionChange,
    onDelete,
}: {
    file: FileRecord;
    onCaptionChange: (id: number, caption: string) => void;
    onDelete: (id: number) => void;
}) {
    const ext = file.original_filename.split('.').pop()?.toUpperCase() ?? 'FILE';
    return (
        <div style={{
            display: 'grid', gridTemplateColumns: '32px minmax(0, 1fr) auto', gap: 10,
            padding: '10px 12px', borderBottom: '1px solid #f5f5f8',
            background: '#fff',
            alignItems: 'start',
        }}>
            <div style={{
                width: 32, height: 32, borderRadius: 6, background: '#e6f1fb',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 8, fontWeight: 800, color: '#185fa5', flexShrink: 0,
            }}>{ext}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12.5, fontWeight: 500, color: '#1e2640', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {file.original_filename}
                </div>
                <div style={{ fontSize: 10, color: '#8892aa' }}>{file.size_formatted}</div>
                <textarea
                    value={file.caption ?? ''}
                    onChange={e => onCaptionChange(file.id, e.target.value)}
                    placeholder="Caption for this supporting evidence"
                    rows={2}
                    style={{
                        width: '100%', marginTop: 8, resize: 'vertical',
                        border: '1px solid #dde1ed', borderRadius: 6,
                        padding: '8px 10px', fontSize: 12.5, lineHeight: 1.45,
                        color: '#1e2640', outline: 'none',
                        fontFamily: "'Inter', sans-serif", background: '#fafbfe',
                    }}
                />
            </div>
            <div style={{ display: 'flex', gap: 5, flexShrink: 0 }}>
                <a
                    href={`/item-files/${file.id}/download`}
                    style={{
                        display: 'flex', alignItems: 'center', padding: '4px 8px',
                        borderRadius: 6, border: '1px solid #dde1ed', background: '#f8f9fc',
                        cursor: 'pointer', color: '#4a5470', textDecoration: 'none', fontSize: 11,
                    }}
                >
                    <Download size={12} />
                </a>
                <button
                    onClick={() => onDelete(file.id)}
                    style={{
                        display: 'flex', alignItems: 'center', padding: '4px 8px',
                        borderRadius: 6, border: '1px solid #fca5a5', background: '#fef2f2',
                        cursor: 'pointer', color: '#dc2626',
                    }}
                >
                    <Trash2 size={12} />
                </button>
            </div>
        </div>
    );
}

// ── Main Modal ───────────────────────────────────────────────────────────────

export default function ItemEditModal({ item, subAreaName, areaName, programId, onClose }: Props) {
    const [loading, setLoading]       = useState(true);
    const [saving, setSaving]         = useState(false);
    const [saveError, setSaveError]   = useState('');
    const [uploading, setUploading]   = useState(false);
    const [uploadQueue, setUploadQueue] = useState<Array<{
        name: string; format: string; size: number; status: 'pending' | 'uploading' | 'done' | 'error';
        progress: number; transferred: number;
    }>>([]);
    const [isDirty, setIsDirty]       = useState(false);
    const [showClosePrompt, setShowClosePrompt] = useState(false);

    const [rating, setRating]         = useState<number | null>(null);
    const [hoverRating, setHoverRating] = useState<number | null>(null);
    const [files, setFiles]           = useState<FileRecord[]>([]);
    const [responseId, setResponseId] = useState<number | null>(null);

    const fileInputRef      = useRef<HTMLInputElement>(null);
    // Skip 2 OnChangePlugin fires before marking dirty:
    //   fire 1 → Lexical init (empty state), fire 2 → LoadInitialContent or LoadInitialText
    const ipoWeight = IPO_WEIGHT[item.ipo_type] ?? 0.20;
    const ipoLabel = item.ipo_type.charAt(0).toUpperCase() + item.ipo_type.slice(1);

    // Load existing response on mount
    useEffect(() => {
        refreshState().finally(() => setLoading(false));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [item.id]);

    /**
     * Re-fetch the current item response (incl. files) from the server.
     * Used after upload/delete so the UI is always in sync with persisted state.
     */
    async function refreshState() {
        try {
            const r = await fetch(`/area-items/${item.id}/response`, {
                headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
            });
            if (!r.ok) return;
            const data = await r.json();
            setResponseId(data.id ?? null);
            setRating(prev => prev ?? data.rating ?? null);
            setFiles(data.files ?? []);
        } catch (e) {
            console.error('[refreshState] failed:', e);
        }
    }

    const handleCaptionChange = (fileId: number, caption: string) => {
        setFiles(prev => prev.map(file => file.id === fileId ? { ...file, caption } : file));
        setIsDirty(true);
    };

    const handleSaveDraft = async (thenClose = false) => {
        setSaving(true);
        setSaveError('');
        try {
            const res = await fetch(`/area-items/${item.id}/response`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...csrfHeaders(),
                },
                body: JSON.stringify({
                    rating,
                }),
            });

            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                const msg = data?.message ?? data?.errors?.program ?? `Save failed (HTTP ${res.status}).`;
                setSaveError(msg);
                setSaving(false);
                return;
            }

            await Promise.all(files.map(file => fetch(`/item-files/${file.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    ...csrfHeaders(),
                },
                body: JSON.stringify({ caption: file.caption ?? null }),
            }).then(async captionRes => {
                if (!captionRes.ok) {
                    const data = await captionRes.json().catch(() => ({}));
                    throw new Error(data.message ?? `Caption save failed (HTTP ${captionRes.status}).`);
                }
            })));

            setSaving(false);
            setIsDirty(false);
            setShowClosePrompt(false);
            if (thenClose) {
                onClose();
            }
        } catch (err) {
            console.error('[SaveDraft] network error:', err);
            setSaveError(err instanceof Error ? err.message : 'Network error. Please check your connection.');
            setSaving(false);
        }
    };

    const handleFileUpload = async (fileList: FileList) => {
        if (!fileList.length) return;
        const files = Array.from(fileList);

        // Build initial queue rows
        const initialQueue = files.map(f => ({
            name: f.name,
            format: '.' + (f.name.split('.').pop()?.toLowerCase() ?? 'bin'),
            size: f.size,
            status: 'pending' as const,
            progress: 0,
            transferred: 0,
        }));
        setUploadQueue(initialQueue);
        setUploading(true);

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            setUploadQueue(q => q.map((r, ri) => ri === i ? { ...r, status: 'uploading' } : r));

            await new Promise<void>(resolve => {
                const xhr = new XMLHttpRequest();
                const form = new FormData();
                form.append('area_item_id', String(item.id));
                form.append('_token', getCsrf());
                form.append('files[]', file);

                xhr.upload.onprogress = (e) => {
                    if (!e.lengthComputable) return;
                    const pct = Math.round((e.loaded / e.total) * 100);
                    setUploadQueue(q => q.map((r, ri) =>
                        ri === i ? { ...r, progress: pct, transferred: e.loaded } : r
                    ));
                };

                xhr.onload = () => {
                    // Treat any 2xx HTTP status as success. Don't depend on response shape parsing
                    // to determine file existence — we'll re-sync from the server below.
                    const ok = xhr.status >= 200 && xhr.status < 300;
                    if (ok) {
                        setUploadQueue(q => q.map((r, ri) =>
                            ri === i ? { ...r, status: 'done', progress: 100, transferred: file.size } : r
                        ));
                    } else {
                        let msg = `Upload failed (HTTP ${xhr.status})`;
                        try {
                            const data = JSON.parse(xhr.responseText || '{}');
                            if (data?.message) msg = data.message;
                        } catch { /* response wasn't JSON */ }
                        setUploadQueue(q => q.map((r, ri) =>
                            ri === i ? { ...r, status: 'error' } : r
                        ));
                        setSaveError(msg);
                    }
                    resolve();
                };
                xhr.onerror = () => {
                    setUploadQueue(q => q.map((r, ri) => ri === i ? { ...r, status: 'error' } : r));
                    resolve();
                };

                xhr.open('POST', '/item-files');
                Object.entries(csrfHeaders()).forEach(([key, value]) => xhr.setRequestHeader(key, value));
                xhr.withCredentials = true;
                xhr.send(form);
            });
        }

        setUploading(false);
        // Single source of truth: refresh the file list from the server after the queue drains.
        // This fixes the "shows error but actually uploaded" mismatch.
        await refreshState();
        // Clear the queue after 3 s so it doesn't linger
        setTimeout(() => setUploadQueue([]), 3000);
    };


    const handleDeleteFile = async (fileId: number) => {
        try {
            const r = await fetch(`/item-files/${fileId}`, {
                method: 'DELETE',
                headers: csrfHeaders(),
            });
            if (!r.ok) {
                const data = await r.json().catch(() => ({}));
                setSaveError(data.message ?? `Delete failed (HTTP ${r.status}).`);
                return;
            }
            // Re-sync from server so duplicate state is impossible
            await refreshState();
        } catch (err) {
            console.error('[DeleteFile] error:', err);
            setSaveError('Could not delete file. Please try again.');
        }
    };

    const handleClose = () => {
        if (isDirty) { setShowClosePrompt(true); return; }
        onClose();
    };

    const lexicalConfig = {
        namespace: `item-editor-${item.id}`,
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

    const activeRating = hoverRating ?? rating ?? 0;
    const weightedPreview = rating !== null ? (rating * ipoWeight).toFixed(2) : '—';

    return (
        <>
            {/* Backdrop */}
            <div
                onClick={handleClose}
                style={{
                    position: 'fixed', inset: 0, background: 'rgba(15,31,61,0.55)',
                    zIndex: 400, backdropFilter: 'blur(2px)',
                }}
            />

            {/* Modal — stopPropagation prevents backdrop firing on modal clicks */}
            <div
                onClick={e => e.stopPropagation()}
                style={{
                    position: 'fixed', top: '50%', left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: '92%', maxWidth: 920, maxHeight: '90vh',
                    background: '#fff', borderRadius: 18,
                    boxShadow: '0 40px 100px rgba(15,31,61,0.28)',
                    zIndex: 401, display: 'flex', flexDirection: 'column',
                    overflow: 'hidden',
                }}
            >
                {/* ── Modal Header ── */}
                <div style={{
                    padding: '16px 20px', borderBottom: '1px solid #dde1ed',
                    display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12,
                    flexShrink: 0,
                }}>
                    <div>
                        <div style={{ fontSize: 11, color: '#8892aa', marginBottom: 2, fontFamily: "'Inter', sans-serif" }}>
                            {areaName} › {subAreaName} › {ipoLabel}
                        </div>
                        <div style={{ fontSize: 17, fontWeight: 700, color: '#0f1f3d', fontFamily: "'Inter', sans-serif" }}>
                            {item.label}
                        </div>
                    </div>
                    <button
                        onClick={handleClose}
                        style={{
                            width: 30, height: 30, borderRadius: 8, border: '1px solid #dde1ed',
                            background: '#f8f9fc', cursor: 'pointer', display: 'flex',
                            alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                        }}
                    >
                        <X size={14} color="#8892aa" />
                    </button>
                </div>

                {/* ── Scrollable Body ── */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '0 0 8px 0' }}>
                    {loading ? (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200 }}>
                            <Loader2 size={24} color="#8892aa" className="animate-spin" />
                        </div>
                    ) : (
                        <>
                            {/* ── Files Section ── */}
                            <div style={{ padding: '16px 20px 0' }}>
                                <div style={{
                                    fontSize: 11, fontWeight: 700, color: '#4a5470',
                                    textTransform: 'uppercase', letterSpacing: '0.06em',
                                    marginBottom: 8, fontFamily: "'Inter', sans-serif",
                                }}>
                                    Supporting Evidence
                                    <span style={{ fontWeight: 400, color: '#8892aa', textTransform: 'none', letterSpacing: 0, marginLeft: 6 }}>
                                        ({files.length} file{files.length !== 1 ? 's' : ''})
                                    </span>
                                </div>

                                {files.length > 0 && (
                                    <div style={{
                                        border: '1px solid #dde1ed', borderRadius: 8,
                                        overflow: 'hidden', marginBottom: 8,
                                    }}>
                                        {files.map(f => (
                                            <FileRow key={f.id} file={f} onCaptionChange={handleCaptionChange} onDelete={handleDeleteFile} />
                                        ))}
                                    </div>
                                )}

                                {/* Upload zone */}
                                <div
                                    onClick={() => !uploading && fileInputRef.current?.click()}
                                    onDragOver={e => e.preventDefault()}
                                    onDrop={e => { e.preventDefault(); if (!uploading) handleFileUpload(e.dataTransfer.files); }}
                                    style={{
                                        border: '2px dashed #c9d4f0', borderRadius: 8,
                                        padding: '14px 20px', textAlign: 'center',
                                        cursor: uploading ? 'not-allowed' : 'pointer',
                                        background: '#fafbfe', opacity: uploading ? 0.6 : 1,
                                        transition: 'border-color 0.15s, background 0.15s',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                                    }}
                                    onMouseEnter={e => { if (!uploading) { e.currentTarget.style.borderColor = '#0f1f3d'; e.currentTarget.style.background = '#f4f6fc'; } }}
                                    onMouseLeave={e => { e.currentTarget.style.borderColor = '#c9d4f0'; e.currentTarget.style.background = '#fafbfe'; }}
                                >
                                    <Upload size={15} color="#8892aa" />
                                    <span style={{ fontSize: 12.5, color: '#8892aa' }}>
                                        {uploading ? 'Uploading…' : 'Click or drag & drop files (multi-select, max 50 MB each)'}
                                    </span>
                                </div>
                                <input ref={fileInputRef} type="file" multiple style={{ display: 'none' }}
                                    onChange={e => e.target.files && handleFileUpload(e.target.files)} />

                                {/* Upload progress table */}
                                {uploadQueue.length > 0 && (
                                    <div style={{ marginTop: 8, border: '1px solid #dde1ed', borderRadius: 8, overflow: 'hidden' }}>
                                        {/* Header */}
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 64px 80px 80px 120px 100px', background: '#f4f6fc', padding: '6px 10px', gap: 8, fontSize: 10, fontWeight: 700, color: '#4a5470', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                            <span>File Name</span>
                                            <span>Format</span>
                                            <span>Size</span>
                                            <span>Status</span>
                                            <span>Progress</span>
                                            <span style={{ textAlign: 'right' }}>Transferred</span>
                                        </div>
                                        {uploadQueue.map((row, i) => {
                                            const kb = (row.size / 1024).toFixed(2);
                                            const xfKb = (row.transferred / 1024).toFixed(0);
                                            const statusColor: Record<string, string> = { pending: '#8892aa', uploading: '#185fa5', done: '#1a7a4a', error: '#9b1c1c' };
                                            return (
                                                <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 64px 80px 80px 120px 100px', padding: '7px 10px', gap: 8, fontSize: 11, color: '#1e2640', borderTop: '1px solid #f0f2f8', alignItems: 'center', background: i % 2 === 0 ? '#fff' : '#fafbfe' }}>
                                                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={row.name}>{row.name}</span>
                                                    <span style={{ color: '#4a5470' }}>{row.format}</span>
                                                    <span>{kb} KB</span>
                                                    <span style={{ color: statusColor[row.status], fontWeight: 600, textTransform: 'capitalize' }}>{row.status}</span>
                                                    <span>
                                                        <div style={{ height: 6, background: '#e8ecf5', borderRadius: 3, overflow: 'hidden' }}>
                                                            <div style={{ height: '100%', width: `${row.progress}%`, background: row.status === 'error' ? '#dc2626' : row.status === 'done' ? '#1a7a4a' : '#185fa5', borderRadius: 3, transition: 'width 0.2s' }} />
                                                        </div>
                                                        <span style={{ fontSize: 9, color: '#8892aa' }}>{row.progress}%</span>
                                                    </span>
                                                    <span style={{ textAlign: 'right', color: '#4a5470' }}>{xfKb} KB / {kb} KB</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}

                            </div>

                            {/* ── Rating Section ── */}
                            <div style={{ padding: '14px 20px 0' }}>
                                <div style={{
                                    fontSize: 11, fontWeight: 700, color: '#4a5470',
                                    textTransform: 'uppercase', letterSpacing: '0.06em',
                                    marginBottom: 10, fontFamily: "'Inter', sans-serif",
                                }}>
                                    Rating
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                                    {/* Stars */}
                                    <div style={{ display: 'flex', gap: 4 }}>
                                        {[1,2,3,4,5].map(n => (
                                            <button
                                                key={n}
                                                type="button"
                                                onMouseEnter={() => setHoverRating(n)}
                                                onMouseLeave={() => setHoverRating(null)}
                                                onClick={() => { setRating(r => r === n ? null : n); setIsDirty(true); }}
                                                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2 }}
                                            >
                                                <Star
                                                    size={26}
                                                    fill={n <= activeRating ? '#f59e0b' : 'none'}
                                                    color={n <= activeRating ? '#f59e0b' : '#d1d5db'}
                                                    style={{ transition: 'fill 0.1s, color 0.1s' }}
                                                />
                                            </button>
                                        ))}
                                    </div>

                                    {/* Numeric display */}
                                    <div style={{
                                        fontSize: 14, fontWeight: 700, color: '#0f1f3d',
                                        fontFamily: "'Inter', sans-serif",
                                    }}>
                                        {rating !== null ? `${rating} / 5` : '—'}
                                    </div>

                                    {/* Weighted preview */}
                                    <div style={{
                                        padding: '5px 12px', borderRadius: 8,
                                        background: '#f0f2f8', fontSize: 12, color: '#4a5470',
                                        fontFamily: "'Inter', sans-serif", fontWeight: 500,
                                    }}>
                                        {(ipoWeight * 100).toFixed(0)}% × {rating ?? '?'} = <strong>{weightedPreview}</strong>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {/* ── Footer ── */}
                <div style={{
                    padding: '14px 20px', borderTop: '1px solid #dde1ed',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    background: '#fafbfe', flexShrink: 0,
                }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <div style={{ fontSize: 11, color: isDirty ? '#f59e0b' : '#b8bfd4', fontWeight: 500 }}>
                            {isDirty ? '● Unsaved changes' : '● All changes saved'}
                        </div>
                        {saveError && (
                            <div style={{ fontSize: 11, color: '#dc2626', fontWeight: 500 }}>
                                ⚠ {saveError}
                            </div>
                        )}
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                        <button
                            type="button"
                            onClick={handleClose}
                            style={{
                                padding: '10px 20px', borderRadius: 8, border: '1px solid #dde1ed',
                                background: '#fff', cursor: 'pointer', fontSize: 13, color: '#4a5470', fontWeight: 500,
                                fontFamily: "'Inter', sans-serif",
                            }}
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={() => handleSaveDraft(false)}
                            disabled={saving}
                            style={{
                                padding: '10px 24px', borderRadius: 8, border: 'none',
                                background: saving ? '#c9d4f0' : '#0f1f3d',
                                cursor: saving ? 'not-allowed' : 'pointer',
                                fontSize: 13, fontWeight: 700, color: '#c9a84c',
                                display: 'flex', alignItems: 'center', gap: 6,
                                fontFamily: "'Inter', sans-serif",
                            }}
                        >
                            {saving && <Loader2 size={13} />}
                            Save Draft
                        </button>
                    </div>
                </div>
            </div>

            {/* —— Close Prompt Overlay (shown when isDirty + X clicked) —— */}
            {showClosePrompt && (
                <div style={{
                    position: 'fixed', inset: 0, background: 'rgba(15,31,61,0.65)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 500,
                }}>
                    <div style={{
                        background: '#fff', borderRadius: 16, padding: '28px 32px', width: 400,
                        boxShadow: '0 24px 70px rgba(0,0,0,0.22)', textAlign: 'center',
                    }}>
                        <div style={{ fontSize: 17, fontWeight: 700, color: '#0f1f3d', marginBottom: 6, fontFamily: "'Inter',sans-serif" }}>
                            You have unsaved changes
                        </div>
                        <div style={{ fontSize: 13, color: '#8892aa', marginBottom: 22, fontFamily: "'Inter',sans-serif" }}>
                            What would you like to do?
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            <button
                                type="button"
                                onClick={() => handleSaveDraft(true)}
                                disabled={saving}
                                style={{
                                    width: '100%', padding: '12px 0', borderRadius: 9, border: 'none',
                                    background: '#0f1f3d', color: '#c9a84c',
                                    fontSize: 13.5, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer',
                                    fontFamily: "'Inter',sans-serif",
                                    opacity: saving ? 0.7 : 1,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                                }}
                            >
                                {saving && <Loader2 size={14} />}
                                Save Draft &amp; Close
                            </button>
                            <button
                                type="button"
                                onClick={() => setShowClosePrompt(false)}
                                style={{
                                    width: '100%', padding: '12px 0', borderRadius: 9,
                                    border: '1.5px solid #dde1ed', background: '#fff',
                                    fontSize: 13.5, fontWeight: 600, cursor: 'pointer',
                                    color: '#4a5470', fontFamily: "'Inter',sans-serif",
                                }}
                            >
                                Keep Writing
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Lexical Editor CSS ── */}
            <style>{`
                .editor-paragraph { margin: 0 0 8px; }
                .editor-h1 { font-size: 1.5em; font-weight: 800; color: #0f1f3d; margin: 12px 0 6px; }
                .editor-h2 { font-size: 1.25em; font-weight: 700; color: #0f1f3d; margin: 10px 0 4px; }
                .editor-h3 { font-size: 1.1em;  font-weight: 600; color: #0f1f3d; margin: 8px 0 4px; }
                .editor-bold          { font-weight: 700; }
                .editor-italic        { font-style: italic; }
                .editor-underline     { text-decoration: underline; }
                .editor-strikethrough { text-decoration: line-through; }
                .editor-ul { margin: 4px 0 4px 20px; list-style-type: disc; }
                .editor-ol { margin: 4px 0 4px 20px; list-style-type: decimal; }
                .editor-li { margin: 2px 0; }
                .editor-li-nested { list-style-type: circle; }
                .editor-quote { border-left: 3px solid #c9d4f0; margin: 8px 0; padding: 4px 12px; color: #4a5470; font-style: italic; }
            `}</style>
        </>
    );
}
