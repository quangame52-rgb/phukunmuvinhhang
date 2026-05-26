import React, { useState, useEffect } from "react";
import { BoardConfig } from "../types";

interface ConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: BoardConfig | null;
  onSave: (config: { pk4: string[]; kun2: string[] }) => void;
}

export default function ConfigModal({
  isOpen,
  onClose,
  config,
  onSave,
}: ConfigModalProps) {
  const [pk4Days, setPk4Days] = useState(["", "", ""]);
  const [kun2Days, setKun2Days] = useState(["", "", "", ""]);

  useEffect(() => {
    if (config) {
      setPk4Days([...config.pk4]);
      setKun2Days([...config.kun2]);
    }
  }, [config, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      pk4: pk4Days,
      kun2: kun2Days,
    });
  };

  const handlePkChange = (index: number, val: string) => {
    const updated = [...pk4Days];
    updated[index] = val;
    setPk4Days(updated);
  };

  const handleKunChange = (index: number, val: string) => {
    const updated = [...kun2Days];
    updated[index] = val;
    setKun2Days(updated);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">⚙️ Cấu Hình Tên Server (Xoay Tour)</div>
        <form onSubmit={handleSubmit}>
          <div className="cfg-grid">
            <div className="cfg-col">
              <h4>🛡️ Phù 2 & Kun 4 (3 Ngày)</h4>
              {pk4Days.map((val, idx) => (
                <div key={idx} className="cfg-group">
                  <label>Ngày {idx + 1}</label>
                  <input
                    type="text"
                    value={val}
                    onChange={(e) => handlePkChange(idx, e.target.value)}
                    className="org-input-text"
                    required
                  />
                </div>
              ))}
            </div>
            <div className="cfg-col">
              <h4 style={{ color: "var(--purple)" }}>🦋 Kun 2 (4 Ngày)</h4>
              {kun2Days.map((val, idx) => (
                <div key={idx} className="cfg-group">
                  <label>Ngày {idx + 1}</label>
                  <input
                    type="text"
                    value={val}
                    onChange={(e) => handleKunChange(idx, e.target.value)}
                    className="org-input-text"
                    required
                  />
                </div>
              ))}
            </div>
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
            <button type="button" className="org-btn btn-reset" onClick={onClose}>
              Hủy
            </button>
            <button type="submit" className="org-btn btn-add">
              💾 Lưu Cấu Hình
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

