import React, { useState, useEffect, useRef } from 'react';
import dayjs from '../utils/dayjs';
import Card from './Card';

interface DatePickerProps {
    value: string;
    onChange: (date: string) => void;
    onClose: () => void;
}

const DatePicker: React.FC<DatePickerProps> = ({ value, onChange, onClose }) => {
    // Initialize with value if valid, otherwise today's date
    const initialDate = dayjs(value).isValid() ? dayjs(value) : dayjs();
    const [currentMonth, setCurrentMonth] = useState(initialDate.startOf('month'));
    const datePickerRef = useRef<HTMLDivElement>(null);
    
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (datePickerRef.current && !datePickerRef.current.contains(event.target as Node)) {
                onClose();
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [onClose]);

    const handlePrevMonth = () => setCurrentMonth(currentMonth.subtract(1, 'month'));
    const handleNextMonth = () => setCurrentMonth(currentMonth.add(1, 'month'));

    const renderDays = () => {
        const days = [];
        // Use startOf('week') which depends on locale (usually Sunday).
        const startDate = currentMonth.startOf('month').startOf('week'); 
        const endDate = currentMonth.endOf('month').endOf('week');
        
        let day = startDate;
        while(day.isBefore(endDate.add(1, 'day'))) {
            const finalDay = day; // create a new variable for the closure
            days.push(
                <div key={finalDay.format('YYYY-MM-DD')} 
                     className="flex items-center justify-center h-10 w-10">
                    <button
                        type="button"
                        onClick={() => {
                            onChange(finalDay.format('YYYY-MM-DD'));
                            onClose();
                        }}
                        className={`w-8 h-8 rounded-full text-sm transition-colors
                            ${!finalDay.isSame(currentMonth, 'month') ? 'text-textSecondary/40' : 'text-textPrimary'}
                            ${finalDay.isSame(dayjs(value), 'day') ? 'bg-primary text-white font-bold' : 'hover:bg-primary/10'}
                            ${finalDay.isSame(dayjs(), 'day') && !finalDay.isSame(dayjs(value), 'day') ? 'border border-primary' : ''}
                        `}
                    >
                        {finalDay.format('D')}
                    </button>
                </div>
            );
            day = day.add(1, 'day');
        }
        return days;
    };

    return (
        <div ref={datePickerRef} className="absolute z-20 mt-2">
            <Card className="!p-4">
                <div className="flex justify-between items-center mb-2 px-2">
                    <button onClick={handlePrevMonth} className="p-2 rounded-full hover:bg-gray-100"><ArrowLeftIcon /></button>
                    <span className="font-bold text-textPrimary text-base">{currentMonth.format('MMMM YYYY')}</span>
                    <button onClick={handleNextMonth} className="p-2 rounded-full hover:bg-gray-100"><ArrowRightIcon /></button>
                </div>
                <div className="grid grid-cols-7 gap-1 text-center text-xs text-textSecondary font-semibold">
                    {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => <div key={day} className="h-8 w-10 flex items-center justify-center">{day}</div>)}
                </div>
                <div className="grid grid-cols-7 gap-1">
                    {renderDays()}
                </div>
            </Card>
        </div>
    );
};

const ArrowLeftIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>;
const ArrowRightIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>;

export default DatePicker;