import React, { useState, useEffect } from "react";
import html2canvas from "html2canvas";

import { DashboardDataResponse } from "./types";
import ScheduleRail from "./components/ScheduleRail";
import MemberTable from "./components/MemberTable";
import ConfigModal from "./components/ConfigModal";

export default function App() {
  const [data, setData] = useState<DashboardDataResponse | null>(null);
  const [offset3, setOffset3] = useState(0);
  const [offset4, setOffset4] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [timeStr, setTimeStr] = useState("");

  // Live Digital Clock
  useEffect(() => {
    const update = () => {
      setTimeStr(new Date().toLocaleTimeString("vi-VN"));
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  // Fetch API payload
  const fetchData = async (o3: number, o4: number) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/data?offset3=${o3}&offset4=${o4}`);
      const payload = await response.json();
      setData(payload);
    } catch (err) {
      console.error("Failed to load dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(offset3, offset4);
  }, [offset3, offset4]);

  // Handle Select actions
  const handleSelectOffset3 = (o: number) => {
    setOffset3(o);
  };

  const handleSelectOffset4 = (o: number) => {
    setOffset4(o);
  };

  // API wrappers
  const handleToggleStatus = async (boardId: number, name: string, status: boolean) => {
    setLoading(true);
    try {
      const dateKey = boardId === 3 ? data?.dateKey4 : data?.dateKey3;
      await fetch("/api/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dateKey, boardId, name, status }),
      });
      fetchData(offset3, offset4);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const handleEditTime = async (boardId: number, name: string, time: string) => {
    setLoading(true);
    try {
      const dateKey = boardId === 3 ? data?.dateKey4 : data?.dateKey3;
      await fetch("/api/member/time", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dateKey, boardId, name, time }),
      });
      fetchData(offset3, offset4);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const handleAddNewMember = async (boardId: number, name: string) => {
    setLoading(true);
    try {
      await fetch("/api/member/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ boardId, name }),
      });
      fetchData(offset3, offset4);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const handleEditName = async (boardId: number, memberId: string, newName: string) => {
    setLoading(true);
    try {
      await fetch("/api/member/edit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ boardId, memberId, newName }),
      });
      fetchData(offset3, offset4);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const handleMoveRow = async (boardId: number, memberId: string, direction: "up" | "down") => {
    setLoading(true);
    try {
      await fetch("/api/member/move", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ boardId, memberId, direction }),
      });
      fetchData(offset3, offset4);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const handleRemoveMember = async (boardId: number, memberId: string, name: string) => {
    if (!confirm(`Xóa nhân vật ${name}?`)) return;
    setLoading(true);
    try {
      await fetch("/api/member/remove", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ boardId, memberId }),
      });
      fetchData(offset3, offset4);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const handleResetTable = async (boardId: number) => {
    if (!confirm("Xóa trạng thái của bảng này trong Server đang chọn?")) return;
    setLoading(true);
    try {
      const dateKey = boardId === 3 ? data?.dateKey4 : data?.dateKey3;
      await fetch("/api/table/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ boardId, dateKey }),
      });
      fetchData(offset3, offset4);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const handleSaveConfig = async (cfg: { pk4: string[]; kun2: string[] }) => {
    setLoading(true);
    try {
      await fetch("/api/config/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cfg),
      });
      setIsConfigOpen(false);
      fetchData(offset3, offset4);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  // Capture of elements containing dashboard matching original function
  const handleTakeScreenshot = () => {
    setLoading(true);
    setTimeout(() => {
      html2canvas(document.body, {
        scale: 2,
        backgroundColor: "#f0f2f5",
        useCORS: true,
        logging: false,
        ignoreElements: (el) => el.hasAttribute("data-html2canvas-ignore"),
      })
        .then((canvas) => {
          const dateStr = new Date().toLocaleDateString("vi-VN").replace(/\//g, "-");
          const link = document.createElement("a");
          link.download = `Dashboard_${dateStr}.png`;
          link.href = canvas.toDataURL("image/png");
          link.click();
        })
        .catch((err) => console.error("Snapshot error:", err))
        .finally(() => setLoading(false));
    }, 400);
  };

  // Removed unrequested AI reporter logic

  return (
    <>
      {/* Loader screen */}
      {loading && <div id="loader">ĐANG XỬ LÝ...</div>}

      {/* Header Container */}
      <div className="org-header org-card">
        <h1>📊 DASHBOARD PHÙ & KUN</h1>
        <div style={{ textAlign: "right" }}>
          <div className="org-clock">{timeStr || "00:00:00"}</div>
          <div
            style={{
              marginTop: "8px",
              display: "flex",
              gap: "5px",
              justifyContent: "flex-end",
              flexWrap: "wrap",
              alignItems: "center",
            }}
          >
            <button
              className="org-btn btn-config btn-small"
              data-html2canvas-ignore
              onClick={() => setIsConfigOpen(true)}
            >
              ⚙️ Cấu hình Server
            </button>
            <button className="org-btn btn-capture btn-small" onClick={handleTakeScreenshot}>
              📸 Chụp ảnh
            </button>
          </div>
        </div>
      </div>

      {/* Rota Schedules */}
      {data && (
        <div className="org-card">
          <ScheduleRail
            title="📅 LỊCH XOAY TOUR: PHÙ 2 & KUN 4 (Chu kỳ 3 ngày)"
            items={data.schedule3}
            activeOffset={offset3}
            onSelectOffset={handleSelectOffset3}
            titleColor="var(--primary)"
            serverColor="var(--primary)"
          />
          <ScheduleRail
            title="📅 LỊCH XOAY TOUR: KUN 2 (Chu kỳ 4 ngày)"
            items={data.schedule4}
            activeOffset={offset4}
            onSelectOffset={handleSelectOffset4}
            titleColor="var(--purple)"
            serverColor="var(--purple)"
          />
        </div>
      )}

      {/* Grid boards columns */}
      {data && (
        <div className="grid-boards">
          <MemberTable
            title="🛡️ BẢNG PHÙ 2"
            boardId={1}
            members={data.list1}
            metrics={data.metrics1}
            dateKey={data.dateStr3}
            serverName={data.srvNames.b1}
            borderClass="phu-border"
            serverStyle={{ color: "var(--primary)" }}
            onToggleStatus={handleToggleStatus}
            onEditTime={handleEditTime}
            onAddNewMember={handleAddNewMember}
            onEditName={handleEditName}
            onMoveRow={handleMoveRow}
            onRemoveMember={handleRemoveMember}
            onResetTable={handleResetTable}
            placeholder="Thêm thành viên Phù 2..."
          />

          <MemberTable
            title="🔥 BẢNG KUN 4"
            boardId={2}
            members={data.list2}
            metrics={data.metrics2}
            dateKey={data.dateStr3}
            serverName={data.srvNames.b2}
            borderClass="kun4-border"
            serverStyle={{ color: "var(--warning)" }}
            onToggleStatus={handleToggleStatus}
            onEditTime={handleEditTime}
            onAddNewMember={handleAddNewMember}
            onEditName={handleEditName}
            onMoveRow={handleMoveRow}
            onRemoveMember={handleRemoveMember}
            onResetTable={handleResetTable}
            placeholder="Thêm thành viên Kun 4..."
          />

          <MemberTable
            title="🦋 BẢNG KUN 2"
            boardId={3}
            members={data.list3}
            metrics={data.metrics3}
            dateKey={data.dateStr4}
            serverName={data.srvNames.b3}
            borderClass="kun2-border"
            serverStyle={{ color: "var(--purple)" }}
            onToggleStatus={handleToggleStatus}
            onEditTime={handleEditTime}
            onAddNewMember={handleAddNewMember}
            onEditName={handleEditName}
            onMoveRow={handleMoveRow}
            onRemoveMember={handleRemoveMember}
            onResetTable={handleResetTable}
            placeholder="Thêm thành viên Kun 2..."
          />
        </div>
      )}

      {/* Config Settings Modal container */}
      {data && (
        <ConfigModal
          isOpen={isConfigOpen}
          onClose={() => setIsConfigOpen(false)}
          config={data.config}
          onSave={handleSaveConfig}
        />
      )}
    </>
  );
}

