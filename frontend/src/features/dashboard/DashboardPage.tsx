import { useEffect, useMemo, useState } from "react";
import {
  BedDouble,
  CalendarClock,
  DoorOpen,
  GraduationCap,
  LogOut,
  Medal
} from "lucide-react";
import {
  getHostels,
  getRoomCategories,
  getStudentProfile,
  getStudentSlot
} from "../../lib/api";
import type {
  CounselingSlot,
  HostelBlock,
  RoomCategory,
  SlotStatus,
  Student
} from "../../lib/types";
import { formatDateTime, formatTimer } from "../../lib/format";
import { clearTokens } from "../../lib/storage";
import { HostelBrowser } from "./HostelBrowser";

type DashboardPageProps = {
  token: string;
  onLogout: () => void;
};

type DashboardData = {
  student: Student;
  slot: CounselingSlot | null;
  slotStatus: SlotStatus;
  hostels: HostelBlock[];
  categories: RoomCategory[];
};

export function DashboardPage({ token, onLogout }: DashboardPageProps) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState("");
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function loadDashboard() {
      try {
        const [profile, slot, hostels, categories] = await Promise.all([
          getStudentProfile(token),
          getStudentSlot(token),
          getHostels(token),
          getRoomCategories(token)
        ]);

        if (!isMounted) {
          return;
        }

        setData({
          student: profile.data.student,
          slot: slot.data.slot,
          slotStatus: slot.data.status,
          hostels: hostels.data.hostels,
          categories: categories.data.categories
        });
      } catch (err) {
        if (!isMounted) {
          return;
        }

        setError(err instanceof Error ? err.message : "Could not load dashboard");
      }
    }

    loadDashboard();

    return () => {
      isMounted = false;
    };
  }, [token]);

  const totalAvailability = useMemo(() => {
    if (!data) {
      return { beds: 0, rooms: 0 };
    }

    return data.categories.reduce(
      (summary, category) => ({
        beds: summary.beds + category.availableBeds,
        rooms: summary.rooms + category.totalRooms
      }),
      { beds: 0, rooms: 0 }
    );
  }, [data]);

  function handleLogout() {
    clearTokens();
    onLogout();
  }

  if (error) {
    return (
      <main className="center-state">
        <div>
          <h1>Could not load dashboard</h1>
          <p>{error}</p>
          <button className="primary-button" onClick={handleLogout} type="button">
            Sign out
          </button>
        </div>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="center-state">
        <div className="loading-pulse" />
        <p>Loading student dashboard</p>
      </main>
    );
  }

  return (
    <main className="dashboard-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Student Dashboard</p>
          <h1>{data.student.name}</h1>
        </div>
        <button className="icon-button" onClick={handleLogout} type="button" title="Sign out">
          <LogOut size={20} />
        </button>
      </header>

      <section className="hero-band">
        <div>
          <p className="eyebrow">Current counseling standing</p>
          <h2>Rank #{data.student.rank ?? "NA"}</h2>
          <p>
            {[data.student.department, data.student.year ? `year ${data.student.year}` : null]
              .filter(Boolean)
              .join(", ")}
          </p>
        </div>
        <div className="hero-metrics">
          <MetricCard icon={<GraduationCap size={22} />} label="CGPA" value={data.student.cgpa.toFixed(2)} />
          <MetricCard icon={<Medal size={22} />} label="Rank" value={`#${data.student.rank ?? "NA"}`} />
          <MetricCard icon={<DoorOpen size={22} />} label="Beds open" value={totalAvailability.beds.toString()} />
        </div>
      </section>

      <section className="dashboard-grid">
        <SlotTimer slot={data.slot} status={data.slotStatus} now={now} />

        <section className="panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Room categories</p>
              <h2>Available choices</h2>
            </div>
            <span className="summary-pill">{totalAvailability.rooms} rooms</span>
          </div>
          <div className="category-grid">
            {data.categories.map((category) => (
              <CategoryCard key={category.id} category={category} />
            ))}
          </div>
        </section>
      </section>

      <HostelBrowser token={token} hostels={data.hostels} categories={data.categories} />
    </main>
  );
}

function MetricCard({
  icon,
  label,
  value
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <article className="metric-card">
      <div className="metric-icon">{icon}</div>
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}

function SlotTimer({
  slot,
  status,
  now
}: {
  slot: CounselingSlot | null;
  status: SlotStatus;
  now: number;
}) {
  const timerLabel = !slot
    ? "No slot"
    : status === "ACTIVE"
      ? formatTimer(slot.endTime)
      : status === "UPCOMING"
        ? formatTimer(slot.startTime)
        : "00:00:00";

  return (
    <section className="panel slot-panel">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Counseling slot</p>
          <h2>{slot?.name ?? "Not assigned"}</h2>
        </div>
        <span className={`status-badge status-${status.toLowerCase()}`}>{status.replace("_", " ")}</span>
      </div>
      <div className="timer-box">
        <CalendarClock size={28} />
        <strong>{timerLabel}</strong>
        <span>{status === "ACTIVE" ? "remaining" : status === "UPCOMING" ? "until slot opens" : "timer"}</span>
      </div>
      {slot ? (
        <div className="slot-times">
          <span>Starts {formatDateTime(slot.startTime)}</span>
          <span>Ends {formatDateTime(slot.endTime)}</span>
          <span>Synced {new Date(now).toLocaleTimeString("en-IN")}</span>
        </div>
      ) : null}
    </section>
  );
}

function CategoryCard({ category }: { category: RoomCategory }) {
  const occupancy = category.totalBeds
    ? Math.round((category.occupiedBeds / category.totalBeds) * 100)
    : 0;

  return (
    <article className="category-card">
      <div className="card-icon">
        <BedDouble size={22} />
      </div>
      <div>
        <h3>{category.name}</h3>
        <p>{category.totalRooms} rooms</p>
      </div>
      <strong>{category.availableBeds}</strong>
      <span>available beds</span>
      <div className="progress-track" aria-hidden="true">
        <div style={{ width: `${occupancy}%` }} />
      </div>
    </article>
  );
}
