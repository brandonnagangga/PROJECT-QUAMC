import { useState } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { Calendar as CalendarIcon } from 'lucide-react';

export default function CalendarCard() {
    const [date, setDate] = useState(new Date());

    return (
        <div style={{
            background: '#fff',
            border: '1px solid #dde1ed',
            borderRadius: 12,
            padding: 20,
        }}>
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                marginBottom: 16,
            }}>
                <CalendarIcon size={16} color="#0f1f3d" />
                <div style={{
                    fontFamily: "'Playfair Display', serif",
                    fontSize: 15,
                    fontWeight: 600,
                    color: '#0f1f3d',
                }}>
                    Calendar
                </div>
            </div>
            
            <div className="dashboard-calendar">
                <Calendar
                    onChange={(value) => setDate(value as Date)}
                    value={date}
                    locale="en-US"
                />
            </div>

            <div style={{
                marginTop: 16,
                padding: '12px 14px',
                background: '#f8f9fc',
                borderRadius: 8,
                fontSize: 11,
                color: '#4a5470',
            }}>
                <div style={{ fontWeight: 600, marginBottom: 4 }}>Selected Date</div>
                <div>{date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
            </div>
        </div>
    );
}
