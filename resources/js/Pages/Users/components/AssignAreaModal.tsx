import { CheckSquare, MapPin, Square } from 'lucide-react';
import { inputStyle, labelStyle, modalActionsStyle, modalStyle, modalTitleStyle, overlayStyle, primaryActionButton, secondaryActionButton } from '../styles';
import type { ProgramInfo, UserInfo } from '../types';

export function AssignAreaModal({
    deanProgramId,
    programs,
    coordUsers,
    assignData,
    setAssignData,
    assignProgram,
    setAssignProgram,
    selectedProgramAreas,
    alreadyAssignedAreaIds,
    newSelectionCount,
    onToggleArea,
    onClose,
    onSubmit,
}: {
    deanProgramId?: number | null;
    programs: ProgramInfo[];
    coordUsers: UserInfo[];
    assignData: { user_id: string; area_ids: number[]; role_type: string; academic_year: string };
    setAssignData: React.Dispatch<React.SetStateAction<{ user_id: string; area_ids: number[]; role_type: string; academic_year: string }>>;
    assignProgram: string;
    setAssignProgram: React.Dispatch<React.SetStateAction<string>>;
    selectedProgramAreas: { id: number; name: string; order_number: number }[];
    alreadyAssignedAreaIds: number[];
    newSelectionCount: number;
    onToggleArea: (areaId: number) => void;
    onClose: () => void;
    onSubmit: () => void;
}) {
    return (
        <div style={overlayStyle} onClick={onClose}>
            <div onClick={(e) => e.stopPropagation()} style={modalStyle}>
                <div style={modalTitleStyle}><MapPin size={18} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 8 }} />Assign Coordinator to Area</div>
                <div style={{ marginBottom: 14 }}>
                    <label style={labelStyle}>Select Coordinator</label>
                    <select value={assignData.user_id} onChange={(e) => setAssignData(prev => ({ ...prev, user_id: e.target.value, area_ids: [] }))} style={inputStyle}>
                        <option value="">Select user...</option>
                        {coordUsers.map(user => <option key={user.id} value={user.id}>{user.name}</option>)}
                    </select>
                </div>
                <div style={{ marginBottom: 14 }}>
                    <label style={labelStyle}>Program</label>
                    {deanProgramId ? (
                        <div style={{ ...inputStyle, background: '#f8fafc', color: '#64748b', display: 'flex', alignItems: 'center' }}>
                            {programs.find(program => program.id === deanProgramId)?.name ?? 'Your Program'}
                        </div>
                    ) : (
                        <select value={assignProgram} onChange={(e) => { setAssignProgram(e.target.value); setAssignData(prev => ({ ...prev, area_ids: [] })); }} style={inputStyle}>
                            <option value="">Select program...</option>
                            {programs.map(program => <option key={program.id} value={program.id}>{program.name} ({program.code})</option>)}
                        </select>
                    )}
                </div>
                <div style={{ marginBottom: 14 }}>
                    <label style={labelStyle}>Areas {newSelectionCount > 0 && <span style={{ color: '#15803d' }}>({newSelectionCount} new)</span>}</label>
                    {!assignProgram ? (
                        <div style={{ ...inputStyle, color: '#94a3b8' }}>Select a program first...</div>
                    ) : (
                        <div style={{ border: '1px solid #e5eaf3', borderRadius: 12, maxHeight: 190, overflowY: 'auto', background: '#fff' }}>
                            {selectedProgramAreas.map((area, index) => {
                                const isAlreadyAssigned = alreadyAssignedAreaIds.includes(area.id);
                                const isChecked = isAlreadyAssigned || assignData.area_ids.includes(area.id);
                                return (
                                    <div key={area.id} onClick={() => onToggleArea(area.id)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', cursor: isAlreadyAssigned ? 'default' : 'pointer', borderBottom: index < selectedProgramAreas.length - 1 ? '1px solid #eef2f7' : 'none', background: isChecked ? '#f8fbff' : '#fff', opacity: isAlreadyAssigned ? 0.7 : 1 }}>
                                        {isChecked ? <CheckSquare size={15} color="#4f46e5" /> : <Square size={15} color="#cbd5e1" />}
                                        <span style={{ fontSize: 12.5, color: '#334155', flex: 1 }}>{area.name}</span>
                                        {isAlreadyAssigned && <span style={{ fontSize: 10, padding: '4px 8px', borderRadius: 999, background: '#f1f5f9', color: '#64748b', fontWeight: 600 }}>Assigned</span>}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
                <div style={{ marginBottom: 20 }}>
                    <label style={labelStyle}>Academic Year</label>
                    <input value={assignData.academic_year} onChange={(e) => setAssignData(prev => ({ ...prev, academic_year: e.target.value }))} style={inputStyle} />
                </div>
                <div style={modalActionsStyle}>
                    <button onClick={onClose} style={secondaryActionButton}>Cancel</button>
                    <button onClick={onSubmit} disabled={newSelectionCount === 0 || !assignData.user_id} style={{ ...primaryActionButton, opacity: (newSelectionCount === 0 || !assignData.user_id) ? 0.5 : 1, cursor: (newSelectionCount === 0 || !assignData.user_id) ? 'not-allowed' : 'pointer' }}>Assign</button>
                </div>
            </div>
        </div>
    );
}
