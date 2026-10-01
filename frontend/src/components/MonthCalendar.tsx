import { useState } from "react";
import { Button } from "antd";
import { LeftOutlined, RightOutlined } from "@ant-design/icons";
import { todayKey } from "../utils/datetime";

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

interface MonthCalendarProps {
  year: number;
  month: number;
  selectedDate?: string;
  onSelectDate: (date: string) => void;
  onMonthChange: (year: number, month: number) => void;
}

function dateKey(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function MonthCalendar({ year, month, selectedDate, onSelectDate, onMonthChange }: MonthCalendarProps) {
  const [mode, setMode] = useState<"month" | "year">("month");
  const today = todayKey();
  const firstWeekday = new Date(year, month - 1, 1).getDay();
  const days = new Date(year, month, 0).getDate();
  const cells: Array<number | null> = [...Array(firstWeekday).fill(null), ...Array.from({ length: days }, (_, index) => index + 1)];

  function shiftMonth(delta: number) {
    const next = new Date(year, month - 1 + delta, 1);
    onMonthChange(next.getFullYear(), next.getMonth() + 1);
  }

  return (
    <div className="calendar">
      <div className="calendar-toolbar">
        <Button aria-label="Previous month" icon={<LeftOutlined />} onClick={() => shiftMonth(-1)} />
        <strong>
          {MONTHS[month - 1]} {year}
        </strong>
        <div>
          <Button type={mode === "month" ? "primary" : "default"} onClick={() => setMode("month")}>
            Month
          </Button>
          <Button type={mode === "year" ? "primary" : "default"} onClick={() => setMode("year")}>
            Year
          </Button>
        </div>
        <Button aria-label="Next month" icon={<RightOutlined />} onClick={() => shiftMonth(1)} />
      </div>
      {mode === "year" ? (
        <div className="year-grid">
          {MONTHS.map((label, index) => (
            <button
              key={label}
              type="button"
              className={index + 1 === month ? "selected" : undefined}
              onClick={() => {
                onMonthChange(year, index + 1);
                setMode("month");
              }}
            >
              {label}
            </button>
          ))}
        </div>
      ) : (
        <div className="calendar-grid">
          {WEEKDAYS.map((day) => (
            <span key={day}>{day}</span>
          ))}
          {cells.map((day, index) => {
            if (!day) {
              return <span key={`empty-${index}`} />;
            }
            const date = dateKey(year, month, day);
            const past = date < today;
            return (
              <button
                key={date}
                type="button"
                disabled={past}
                className={[date === today ? "today" : "", date === selectedDate ? "selected" : ""].filter(Boolean).join(" ")}
                aria-pressed={date === selectedDate}
                aria-label={date}
                onClick={() => onSelectDate(date)}
              >
                {day}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
