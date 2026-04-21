export function UsersSummaryCards({
    totalUsers,
    newHiresThisMonth,
    averageTenureYears,
    activePrograms,
    activeUsers,
}: {
    totalUsers: number;
    newHiresThisMonth: number;
    averageTenureYears: string;
    activePrograms: number;
    activeUsers: number;
}) {
    const summaryCards = [
        { label: 'Total Users', value: totalUsers, change: `+${Math.max(1, newHiresThisMonth)} from last month`, tone: '#3b82f6' },
        { label: 'New Users This Month', value: newHiresThisMonth, change: `+${newHiresThisMonth} this month`, tone: '#8b5cf6' },
        { label: 'Average Tenure (Years)', value: averageTenureYears, change: '+1.2% from last year', tone: '#0f172a' },
        { label: 'Active Programs', value: activePrograms, change: `${activeUsers} active users`, tone: '#10b981' },
    ];

    return (
        <div style={{ background: 'var(--color-panel-bg)', border: '1px solid var(--color-panel-border)', borderRadius: 20, padding: '18px 22px', boxShadow: '0 16px 36px rgba(15, 23, 42, 0.04)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 18 }}>
                {summaryCards.map((card, index) => (
                    <div key={card.label} style={{ paddingLeft: index === 0 ? 0 : 18, borderLeft: index === 0 ? 'none' : '1px solid var(--color-border)' }}>
                        <div style={{ marginBottom: 10, fontSize: 12.5, color: 'var(--color-text-secondary)' }}>{card.label}</div>
                        <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--color-text)', lineHeight: 1.1 }}>{card.value}</div>
                        <div style={{ marginTop: 8, fontSize: 12, color: card.tone }}>{card.change}</div>
                    </div>
                ))}
            </div>
        </div>
    );
}
