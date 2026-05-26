import React from "react";
import { ScheduleItem } from "../types";

interface ScheduleRailProps {
  title: string;
  items: ScheduleItem[];
  activeOffset: number;
  onSelectOffset: (offset: number) => void;
  titleColor: string;
  serverColor?: string;
}

export default function ScheduleRail({
  title,
  items,
  activeOffset,
  onSelectOffset,
  titleColor,
  serverColor,
}: ScheduleRailProps) {
  return (
    <>
      <div className="sch-title" style={{ color: titleColor }}>
        {title}
      </div>
      <div className="schedule-grid">
        {items.map((item) => {
          const isActive = item.offset === activeOffset;
          return (
            <div
              key={item.offset}
              onClick={() => onSelectOffset(item.offset)}
              className={`schedule-item ${isActive ? "active-day" : ""}`}
            >
              <div className="sch-date">{item.date}</div>
              <div className="sch-day">{item.dayName}</div>
              <div className="sch-srv" style={{ color: serverColor }}>
                {item.server}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

