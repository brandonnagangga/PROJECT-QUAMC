import { FileSpreadsheet, FileText, Globe2, Sheet } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { getPrimaryActionButton, modalActionsStyle, modalStyle, modalTitleStyle, overlayStyle, secondaryActionButton } from '../styles';
import type { UserExportFormat } from '../types';

export function ExportUsersModal({
    onClose,
    onExport,
}: {
    onClose: () => void;
    onExport: (format: UserExportFormat) => void;
}) {
    const { theme } = useTheme();
    const isMinimalist = theme.mode === 'minimalist';

    return (
        <div style={overlayStyle} onClick={onClose}>
            <div onClick={(event) => event.stopPropagation()} style={{ ...modalStyle, width: 560 }}>
                <div style={modalTitleStyle}>Export Users Directory</div>
                <div style={{ display: 'grid', gap: 12, marginBottom: 22 }}>
                    <button type="button" onClick={() => onExport('csv')} style={optionButtonStyle}>
                        <div style={optionIconStyle}><FileSpreadsheet size={18} /></div>
                        <div style={{ flex: 1, textAlign: 'left' }}>
                            <div style={optionTitleStyle}>Export as CSV</div>
                            <div style={optionCopyStyle}>Spreadsheet-friendly export for reports and editing.</div>
                        </div>
                    </button>
                    <button type="button" onClick={() => onExport('pdf')} style={optionButtonStyle}>
                        <div style={optionIconStyle}><FileText size={18} /></div>
                        <div style={{ flex: 1, textAlign: 'left' }}>
                            <div style={optionTitleStyle}>Export as PDF</div>
                            <div style={optionCopyStyle}>Printable directory snapshot with users, roles, and departments.</div>
                        </div>
                    </button>
                    <div style={disabledOptionStyle}>
                        <div style={optionIconStyle}><Globe2 size={18} /></div>
                        <div style={{ flex: 1 }}>
                            <div style={optionTitleStyle}>Make Online Google Form</div>
                            <div style={optionCopyStyle}>Soon</div>
                        </div>
                    </div>
                    <div style={disabledOptionStyle}>
                        <div style={optionIconStyle}><Sheet size={18} /></div>
                        <div style={{ flex: 1 }}>
                            <div style={optionTitleStyle}>Make Online Google Sheets</div>
                            <div style={optionCopyStyle}>Soon</div>
                        </div>
                    </div>
                </div>
                <div style={modalActionsStyle}>
                    <button onClick={onClose} style={secondaryActionButton}>Close</button>
                    <button onClick={() => onExport('csv')} style={getPrimaryActionButton(isMinimalist)}>Export CSV</button>
                </div>
            </div>
        </div>
    );
}

const optionButtonStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 14,
    width: '100%',
    padding: '15px 16px',
    borderRadius: 14,
    border: '1px solid #e5e7eb',
    background: '#fff',
    cursor: 'pointer',
};

const disabledOptionStyle: React.CSSProperties = {
    ...optionButtonStyle,
    opacity: 0.6,
    cursor: 'not-allowed',
};

const optionIconStyle: React.CSSProperties = {
    width: 38,
    height: 38,
    borderRadius: 12,
    background: '#f8fafc',
    border: '1px solid #e5e7eb',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#111827',
    flexShrink: 0,
};

const optionTitleStyle: React.CSSProperties = {
    fontSize: 13,
    fontWeight: 600,
    color: '#0f172a',
};

const optionCopyStyle: React.CSSProperties = {
    marginTop: 4,
    fontSize: 12,
    color: '#64748b',
    lineHeight: 1.45,
};
