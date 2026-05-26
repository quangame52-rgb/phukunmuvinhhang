import React, { useState } from "react";
import { Member, Metrics } from "../types";

interface MemberTableProps {
  title: string;
  boardId: number;
  members: Member[];
  metrics: Metrics;
  dateKey: string;
  serverName: string;
  borderClass: string;
  serverStyle?: React.CSSProperties;
  onToggleStatus: (boardId: number, name: string, status: boolean) => void;
  onEditTime: (boardId: number, name: string, time: string) => void;
  onAddNewMember: (boardId: number, name: string) => void;
  onEditName: (boardId: number, memberId: string, name: string) => void;
  onMoveRow: (boardId: number, memberId: string, direction: "up" | "down") => void;
  onRemoveMember: (boardId: number, memberId: string, name: string) => void;
  onResetTable: (boardId: number) => void;
  placeholder?: string;
}

export default function MemberTable({
  title,
  boardId,
  members,
  metrics,
  dateKey,
  serverName,
  borderClass,
  serverStyle,
  onToggleStatus,
  onEditTime,
  onAddNewMember,
  onEditName,
  onMoveRow,
  onRemoveMember,
  onResetTable,
  placeholder,
}: MemberTableProps) {
  const [newInputName, setNewInputName] = useState("");

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newInputName.trim()) return;
    onAddNewMember(boardId, newInputName.trim());
    setNewInputName("");
  };

  const handleEditTimeClick = (name: string, oldTime: string) => {
    const defaultVal = oldTime || new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
    const promptVal = prompt("Sửa thời gian (HH:mm dd/MM):", defaultVal);
    if (promptVal !== null) {
      onEditTime(boardId, name, promptVal.trim());
    }
  };

  const handleEditNameClick = (memberId: string, oldName: string) => {
    const promptVal = prompt("Sửa tên nhân vật:", oldName);
    if (promptVal && promptVal.trim()) {
      onEditName(boardId, memberId, promptVal.trim());
    }
  };

  return (
    <div className={`org-card ${borderClass}`}>
      {/* Header element */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "5px", flexWrap: "wrap", gap: "5px" }}>
        <h2 style={{ fontSize: "16px" }}>{title}</h2>
        <button
          className="org-btn btn-reset btn-small"
          data-html2canvas-ignore
          onClick={() => onResetTable(boardId)}
        >
          Xóa trạng thái
        </button>
      </div>

      {/* Date & Server badges */}
      <div style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "12px", fontWeight: "bold" }}>
        📅 Ngày: <span>{dateKey}</span> - SV: <span style={serverStyle}>{serverName}</span>
      </div>

      {/* Mini Metrics */}
      <div className="mini-metrics">
        <div className="stat-box">
          <span className="stat-lab">Tổng</span>
          <span className="stat-val" style={{ color: "var(--primary)" }}>{metrics.total}</span>
        </div>
        <div className="stat-box">
          <span className="stat-lab">Xong</span>
          <span className="stat-val" style={{ color: "var(--success)" }}>{metrics.completed}</span>
        </div>
        <div className="stat-box">
          <span className="stat-lab">Chờ</span>
          <span className="stat-val" style={{ color: "var(--warning)" }}>{metrics.pending}</span>
        </div>
      </div>

      {/* Inline Form to Add Roster */}
      <form onSubmit={handleAddSubmit} className="add-form" data-html2canvas-ignore>
        <input
          type="text"
          value={newInputName}
          onChange={(e) => setNewInputName(e.target.value)}
          placeholder={placeholder || "Thêm thành viên..."}
          className="org-input-text"
        />
        <button type="submit" className="org-btn btn-add btn-small">
          ➕
        </button>
      </form>

      {/* Data Table */}
      <div className="table-container">
        <table className="org-table">
          <thead>
            <tr>
              <th>STT</th>
              <th>NHÂN VẬT</th>
              <th>TRẠNG THÁI</th>
              <th data-html2canvas-ignore>HÀNH ĐỘNG</th>
            </tr>
          </thead>
          <tbody>
            {members.length === 0 ? (
              <tr>
                <td colSpan={4} style={{ textAlign: "center", color: "var(--text-muted)", fontStyle: "italic" }}>
                  Chưa có thành viên nào được ghi danh.
                </td>
              </tr>
            ) : (
              members.map((item, index) => {
                const badgeClass = item.status ? "tag-done" : "tag-wait";
                const badgeText = item.status ? "HOÀN THÀNH" : "ĐANG CHỜ";
                return (
                  <tr key={item.id}>
                    <td style={{ fontWeight: "bold", color: "var(--text-muted)" }}>{item.stt}</td>
                    <td style={{ fontWeight: 700 }}>{item.name}</td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <input
                          type="checkbox"
                          checked={item.status}
                          onChange={(e) => onToggleStatus(boardId, item.name, e.target.checked)}
                        />
                        <span className={`status-tag ${badgeClass}`}>{badgeText}</span>
                      </div>
                      {item.status && (
                        <div
                          className="time-badge"
                          title="Sửa giờ"
                          onClick={() => handleEditTimeClick(item.name, item.time)}
                        >
                          ⏱ {item.time || "Thêm giờ"} ✏️
                        </div>
                      )}
                    </td>
                    <td data-html2canvas-ignore>
                      <div style={{ display: "flex", gap: "2px" }}>
                        <button
                          className="btn-icon"
                          title="Sửa tên"
                          onClick={() => handleEditNameClick(item.id, item.name)}
                        >
                          🗡️
                        </button>
                        <button
                          type="button"
                          className="btn-icon"
                          onClick={() => onMoveRow(boardId, item.id, "up")}
                        >
                          ⬆️
                        </button>
                        <button
                          type="button"
                          className="btn-icon"
                          onClick={() => onMoveRow(boardId, item.id, "down")}
                        >
                          ⬇️
                        </button>
                        <button
                          className="btn-icon"
                          title="Xóa"
                          onClick={() => onRemoveMember(boardId, item.id, item.name)}
                        >
                          🦋
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

