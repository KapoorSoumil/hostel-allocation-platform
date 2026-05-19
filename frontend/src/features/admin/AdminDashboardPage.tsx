import { useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  BedDouble,
  Building2,
  CalendarClock,
  FileSpreadsheet,
  LogOut,
  Plus,
  RefreshCw,
  UsersRound
} from "lucide-react";
import {
  createCounselingSlot,
  createHostel,
  createRoom,
  getAdminDashboard,
  getAllocationReport,
  importStudents,
  updateCounselingSlot
} from "../../lib/api";
import type { AdminDashboardData, AllocationReportRow } from "../../lib/types";
import { clearTokens } from "../../lib/storage";

type AdminDashboardPageProps = {
  token: string;
  onLogout: () => void;
};

export function AdminDashboardPage({ token, onLogout }: AdminDashboardPageProps) {
  const [data, setData] = useState<AdminDashboardData | null>(null);
  const [report, setReport] = useState<AllocationReportRow[]>([]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  async function loadAdminData() {
    setIsLoading(true);
    setError("");

    try {
      const [dashboardResponse, reportResponse] = await Promise.all([
        getAdminDashboard(token),
        getAllocationReport(token)
      ]);
      setData(dashboardResponse.data);
      setReport(reportResponse.data.allocations);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load admin dashboard");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadAdminData();
  }, [token]);

  function handleLogout() {
    clearTokens();
    onLogout();
  }

  async function runAction(action: () => Promise<unknown>, successMessage: string) {
    setMessage("");
    setError("");

    try {
      await action();
      setMessage(successMessage);
      await loadAdminData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Admin action failed");
    }
  }

  const hostelChart = useMemo(() => data?.hostels.slice(0, 6) ?? [], [data]);

  if (isLoading && !data) {
    return (
      <main className="center-state">
        <div className="loading-pulse" />
        <p>Loading admin dashboard</p>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="center-state">
        <div>
          <h1>Could not load admin dashboard</h1>
          <p>{error}</p>
          <button className="primary-button" onClick={handleLogout} type="button">
            Sign out
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="admin-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Admin Dashboard</p>
          <h1>Hostel Operations</h1>
        </div>
        <div className="admin-actions">
          <button className="secondary-button" onClick={loadAdminData} type="button">
            <RefreshCw size={18} /> Refresh
          </button>
          <button className="icon-button" onClick={handleLogout} type="button" title="Sign out">
            <LogOut size={20} />
          </button>
        </div>
      </header>

      {message ? <p className="inline-success admin-alert">{message}</p> : null}
      {error ? <p className="inline-error admin-alert">{error}</p> : null}

      <section className="admin-stat-grid">
        <AdminStat icon={<UsersRound size={22} />} label="Students" value={data.stats.totalStudents} />
        <AdminStat icon={<BedDouble size={22} />} label="Allocated" value={data.stats.allocatedStudents} />
        <AdminStat icon={<Building2 size={22} />} label="Rooms" value={data.stats.totalRooms} />
        <AdminStat icon={<BarChart3 size={22} />} label="Occupancy" value={`${data.stats.occupancyRate}%`} />
      </section>

      <section className="admin-grid">
        <section className="admin-panel analytics-panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Live statistics</p>
              <h2>Occupancy analytics</h2>
            </div>
            <span className="summary-pill">{data.stats.availableBeds} beds open</span>
          </div>
          <div className="large-progress">
            <div style={{ width: `${data.stats.occupancyRate}%` }} />
          </div>
          <div className="bar-chart">
            {hostelChart.map((hostel) => {
              const percent = hostel.totalBeds ? Math.round((hostel.occupiedBeds / hostel.totalBeds) * 100) : 0;
              return (
                <div key={hostel.id}>
                  <span>{hostel.name}</span>
                  <div>
                    <strong style={{ height: `${Math.max(percent, 4)}%` }} />
                  </div>
                  <small>{percent}%</small>
                </div>
              );
            })}
          </div>
        </section>

        <AdminImportPanel
          onImport={(csv) => runAction(() => importStudents(token, csv), "Students imported and ranked")}
        />
      </section>

      <section className="admin-grid">
        <HostelManagementPanel
          data={data}
          onCreate={(input) => runAction(() => createHostel(token, input), "Hostel block created")}
        />
        <RoomManagementPanel
          data={data}
          onCreate={(input) => runAction(() => createRoom(token, input), "Room created")}
        />
      </section>

      <section className="admin-grid">
        <SlotControlPanel
          data={data}
          onCreate={(input) => runAction(() => createCounselingSlot(token, input), "Counseling slot created")}
          onToggle={(slot) =>
            runAction(
              () => updateCounselingSlot(token, slot.id, { ...slot, isActive: !slot.isActive }),
              `Slot ${slot.isActive ? "paused" : "activated"}`
            )
          }
        />
        <AllocationMonitoringPanel allocations={data.recentAllocations} />
      </section>

      <section className="admin-panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Allocation reports</p>
            <h2>Report table</h2>
          </div>
          <span className="summary-pill">{report.length} records</span>
        </div>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Rank</th>
                <th>Hostel</th>
                <th>Room</th>
                <th>Allocated</th>
              </tr>
            </thead>
            <tbody>
              {report.map((row) => (
                <tr key={row.id}>
                  <td>
                    <strong>{row.studentName}</strong>
                    <span>{row.registrationNumber}</span>
                  </td>
                  <td>{row.rank ?? "NA"}</td>
                  <td>{row.hostel}</td>
                  <td>{row.roomNumber}</td>
                  <td>{new Date(row.allocatedAt).toLocaleString("en-IN")}</td>
                </tr>
              ))}
              {!report.length ? (
                <tr>
                  <td colSpan={5}>No allocations yet.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

function AdminStat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
  return (
    <article className="admin-stat-card">
      <div className="metric-icon">{icon}</div>
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}

function AdminImportPanel({ onImport }: { onImport: (csv: string) => void }) {
  const [csv, setCsv] = useState(
    "registrationNumber,name,email,phone,department,year,gender,cgpa\n22NEW011,New Student,new.student@example.edu,9876500011,Computer Science,2,MALE,8.88"
  );

  return (
    <section className="admin-panel">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Student import</p>
          <h2>CGPA ranking upload</h2>
        </div>
        <FileSpreadsheet size={22} />
      </div>
      <textarea className="admin-textarea" value={csv} onChange={(event) => setCsv(event.target.value)} />
      <button className="primary-button" onClick={() => onImport(csv)} type="button">
        Import students
      </button>
    </section>
  );
}

function HostelManagementPanel({
  data,
  onCreate
}: {
  data: AdminDashboardData;
  onCreate: (input: { name: string; gender?: string | null; description?: string | null; isActive?: boolean }) => void;
}) {
  const [name, setName] = useState("");

  return (
    <section className="admin-panel">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Hostel management</p>
          <h2>Blocks</h2>
        </div>
        <span className="summary-pill">{data.hostels.length} blocks</span>
      </div>
      <div className="compact-form">
        <input value={name} onChange={(event) => setName(event.target.value)} placeholder="New hostel block" />
        <button onClick={() => name && onCreate({ name, isActive: true })} type="button">
          <Plus size={16} />
        </button>
      </div>
      <div className="admin-list">
        {data.hostels.map((hostel) => (
          <article key={hostel.id}>
            <strong>{hostel.name}</strong>
            <span>{hostel.totalRooms} rooms, {hostel.availableBeds} beds open</span>
          </article>
        ))}
      </div>
    </section>
  );
}

function RoomManagementPanel({
  data,
  onCreate
}: {
  data: AdminDashboardData;
  onCreate: (input: {
    hostelBlockId: string;
    categoryId: string;
    roomNumber: string;
    floor?: number | null;
    capacity: number;
    isAvailable?: boolean;
  }) => void;
}) {
  const [roomNumber, setRoomNumber] = useState("");
  const firstHostel = data.hostels[0]?.id ?? "";
  const firstCategory = data.categories[0]?.id ?? "";

  return (
    <section className="admin-panel">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Room management</p>
          <h2>Inventory</h2>
        </div>
        <span className="summary-pill">{data.rooms.length} rooms</span>
      </div>
      <div className="compact-form">
        <input value={roomNumber} onChange={(event) => setRoomNumber(event.target.value)} placeholder="Room no." />
        <button
          onClick={() =>
            roomNumber && firstHostel && firstCategory
              ? onCreate({
                  hostelBlockId: firstHostel,
                  categoryId: firstCategory,
                  roomNumber,
                  capacity: data.categories[0].capacity,
                  isAvailable: true
                })
              : undefined
          }
          type="button"
        >
          <Plus size={16} />
        </button>
      </div>
      <div className="admin-list">
        {data.rooms.slice(0, 8).map((room) => (
          <article key={room.id}>
            <strong>Room {room.roomNumber}</strong>
            <span>{room.hostelBlock.name}, {room.currentOccupancy}/{room.capacity} occupied</span>
          </article>
        ))}
      </div>
    </section>
  );
}

function SlotControlPanel({
  data,
  onCreate,
  onToggle
}: {
  data: AdminDashboardData;
  onCreate: (input: {
    name: string;
    startTime: string;
    endTime: string;
    minRank: number;
    maxRank: number;
    isActive?: boolean;
  }) => void;
  onToggle: (slot: AdminDashboardData["slots"][number]) => void;
}) {
  const [name, setName] = useState("New counseling slot");

  return (
    <section className="admin-panel">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Counseling controls</p>
          <h2>Slot schedule</h2>
        </div>
        <CalendarClock size={22} />
      </div>
      <div className="compact-form">
        <input value={name} onChange={(event) => setName(event.target.value)} />
        <button
          onClick={() =>
            onCreate({
              name,
              startTime: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
              endTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
              minRank: 1,
              maxRank: 25,
              isActive: false
            })
          }
          type="button"
        >
          <Plus size={16} />
        </button>
      </div>
      <div className="admin-list">
        {data.slots.map((slot) => (
          <article key={slot.id}>
            <div>
              <strong>{slot.name}</strong>
              <span>Rank {slot.minRank}-{slot.maxRank}</span>
            </div>
            <button className="mini-action" onClick={() => onToggle(slot)} type="button">
              {slot.isActive ? "Pause" : "Activate"}
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}

function AllocationMonitoringPanel({ allocations }: { allocations: AdminDashboardData["recentAllocations"] }) {
  return (
    <section className="admin-panel">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Allocation monitoring</p>
          <h2>Recent activity</h2>
        </div>
        <span className="summary-pill">Live</span>
      </div>
      <div className="admin-list">
        {allocations.map((allocation) => (
          <article key={allocation.id}>
            <strong>{allocation.student.name}</strong>
            <span>Room {allocation.room.roomNumber}, {allocation.room.hostelBlock.name}</span>
          </article>
        ))}
        {!allocations.length ? <p>No allocation activity yet.</p> : null}
      </div>
    </section>
  );
}
