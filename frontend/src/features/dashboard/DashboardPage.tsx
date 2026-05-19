import { useCallback, useEffect, useMemo, useState } from "react";
import {
  BedDouble,
  CalendarClock,
  CheckCircle2,
  DoorOpen,
  GraduationCap,
  LogOut,
  Medal,
  ShieldCheck,
  UserPlus,
  X
} from "lucide-react";
import {
  createRoommateRequest,
  getAllocationStatus,
  getCurrentAllocation,
  getHostels,
  getRoomCategories,
  getRoommateRequests,
  getStudentProfile,
  getStudentSlot,
  verifyRoommateOtp
} from "../../lib/api";
import type {
  CounselingSlot,
  Allocation,
  AllocationStatus,
  HostelBlock,
  RoomCategory,
  RoommateOtpDelivery,
  RoommateRequest,
  SlotStatus,
  Student
} from "../../lib/types";
import { formatDateTime, formatTimer } from "../../lib/format";
import { clearTokens } from "../../lib/storage";
import type { RealtimeMessage } from "../../lib/realtime";
import { useRealtime } from "../../hooks/useRealtime";
import { HostelBrowser } from "./HostelBrowser";

type DashboardPageProps = {
  token: string;
  onLogout: () => void;
};

type DashboardData = {
  student: Student;
  slot: CounselingSlot | null;
  slotStatus: SlotStatus;
  allocation: Allocation | null;
  allocationStatus: AllocationStatus;
  roommateRequests: RoommateRequest[];
  hostels: HostelBlock[];
  categories: RoomCategory[];
};

export function DashboardPage({ token, onLogout }: DashboardPageProps) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState("");
  const [now, setNow] = useState(() => Date.now());
  const [refreshVersion, setRefreshVersion] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function loadDashboard() {
      try {
        const [
          profile,
          slot,
          allocation,
          allocationStatus,
          roommateRequests,
          hostels,
          categories
        ] = await Promise.all([
          getStudentProfile(token),
          getStudentSlot(token),
          getCurrentAllocation(token),
          getAllocationStatus(token),
          getRoommateRequests(token),
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
          allocation: allocation.data.allocation,
          allocationStatus: allocationStatus.data,
          roommateRequests: roommateRequests.data.requests,
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
  }, [token, refreshVersion]);

  const handleRealtimeMessage = useCallback((message: RealtimeMessage) => {
    if (
      message.event === "ROOM_AVAILABILITY_CHANGED" ||
      message.event === "OCCUPANCY_CHANGED" ||
      message.event === "COUNSELING_SLOT_CHANGED" ||
      message.event === "ALLOCATION_CREATED" ||
      message.event === "ROOMMATE_REQUEST_CHANGED"
    ) {
      setRefreshVersion((version) => version + 1);
    }
  }, []);

  const realtime = useRealtime(token, handleRealtimeMessage);

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

      <div className="live-strip">
        <span className={`live-dot live-${realtime.state.toLowerCase()}`} />
        <strong>{realtime.state === "LIVE" ? "Live updates on" : realtime.state === "CONNECTING" ? "Connecting live updates" : "Live updates offline"}</strong>
        <small>{realtime.lastEventAt ? `Last event ${new Date(realtime.lastEventAt).toLocaleTimeString("en-IN")}` : "Waiting for events"}</small>
      </div>

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

      {data.allocation ? <AllocationConfirmation allocation={data.allocation} /> : null}

      <RoommatePanel
        token={token}
        requests={data.roommateRequests}
        onRequestsChange={(roommateRequests) =>
          setData((current) => (current ? { ...current, roommateRequests } : current))
        }
      />

      <HostelBrowser
        token={token}
        hostels={data.hostels}
        categories={data.categories}
        initialAllocation={data.allocation}
        allocationStatus={data.allocationStatus}
        realtimeVersion={refreshVersion}
        onAllocated={(allocation) =>
          setData((current) =>
            current
              ? {
                  ...current,
                  student: { ...current.student, isAllocated: true },
                  allocation,
                  allocationStatus: {
                    ...current.allocationStatus,
                    isAllocated: true,
                    canAllocate: false
                  }
                }
              : current
          )
        }
      />
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

function AllocationConfirmation({ allocation }: { allocation: Allocation }) {
  return (
    <section className="allocation-confirmation">
      <div className="confirmation-icon">
        <CheckCircle2 size={24} />
      </div>
      <div>
        <p className="eyebrow">Allocation confirmed</p>
        <h2>
          Room {allocation.room.roomNumber}, {allocation.room.hostelBlock.name}
        </h2>
        <p>{allocation.receipt.message}</p>
      </div>
      <div className="receipt-box">
        <span>Receipt</span>
        <strong>{allocation.receipt.receiptNumber}</strong>
        <small>{new Date(allocation.receipt.issuedAt).toLocaleString("en-IN")}</small>
      </div>
    </section>
  );
}

function RoommatePanel({
  token,
  requests,
  onRequestsChange
}: {
  token: string;
  requests: RoommateRequest[];
  onRequestsChange: (requests: RoommateRequest[]) => void;
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const verifiedCount = requests.filter((request) => request.status === "VERIFIED").length;

  return (
    <section className="roommate-panel">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Roommate verification</p>
          <h2>Verified roommate choices</h2>
        </div>
        <button className="secondary-button" onClick={() => setIsModalOpen(true)} type="button">
          <UserPlus size={18} /> Add roommate
        </button>
      </div>

      <div className="roommate-summary-grid">
        <div>
          <span>Verified</span>
          <strong>{verifiedCount}</strong>
        </div>
        <div>
          <span>Pending</span>
          <strong>{requests.filter((request) => request.status === "PENDING").length}</strong>
        </div>
      </div>

      <div className="roommate-list">
        {requests.length ? (
          requests.map((request) => (
            <article key={request.id}>
              <div>
                <strong>{request.roommateStudent.name}</strong>
                <span>{request.roommateStudent.registrationNumber}</span>
              </div>
              <span className={`request-status status-${request.status.toLowerCase()}`}>
                {request.status}
              </span>
            </article>
          ))
        ) : (
          <p>No roommate requests yet.</p>
        )}
      </div>

      {isModalOpen ? (
        <RoommateModal
          token={token}
          onClose={() => setIsModalOpen(false)}
          onRequestUpdated={(request) => {
            const nextRequests = [
              request,
              ...requests.filter((existing) => existing.id !== request.id)
            ];
            onRequestsChange(nextRequests);
          }}
        />
      ) : null}
    </section>
  );
}

function RoommateModal({
  token,
  onClose,
  onRequestUpdated
}: {
  token: string;
  onClose: () => void;
  onRequestUpdated: (request: RoommateRequest) => void;
}) {
  const [registrationNumber, setRegistrationNumber] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [activeRequest, setActiveRequest] = useState<RoommateRequest | null>(null);
  const [delivery, setDelivery] = useState<RoommateOtpDelivery | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function submitRequest(event: React.FormEvent) {
    event.preventDefault();
    setIsSubmitting(true);
    setError("");
    setSuccess("");

    try {
      const response = await createRoommateRequest(token, {
        registrationNumber,
        phone
      });
      setActiveRequest(response.data.request);
      setDelivery(response.data.delivery);
      onRequestUpdated(response.data.request);
      setSuccess(`OTP sent to ${response.data.delivery.maskedPhone}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not generate OTP");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function submitOtp(event: React.FormEvent) {
    event.preventDefault();

    if (!activeRequest) {
      return;
    }

    setIsSubmitting(true);
    setError("");
    setSuccess("");

    try {
      const response = await verifyRoommateOtp(token, {
        requestId: activeRequest.id,
        otp
      });
      setActiveRequest(response.data.request);
      onRequestUpdated(response.data.request);
      setSuccess("Roommate verified successfully");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not verify OTP");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="modal-backdrop" role="presentation">
      <section className="roommate-modal" role="dialog" aria-modal="true" aria-labelledby="roommate-modal-title">
        <div className="detail-heading">
          <div>
            <p className="eyebrow">Secure OTP check</p>
            <h3 id="roommate-modal-title">Add roommate</h3>
          </div>
          <button onClick={onClose} type="button" title="Close roommate modal">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={submitRequest}>
          <label className="field">
            Roommate registration number
            <span className="input-shell">
              <UserPlus size={18} />
              <input
                value={registrationNumber}
                onChange={(event) => setRegistrationNumber(event.target.value)}
                placeholder="22CSE002"
                disabled={Boolean(activeRequest)}
              />
            </span>
          </label>

          <label className="field">
            Registered phone number
            <span className="input-shell">
              <ShieldCheck size={18} />
              <input
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                placeholder="9876500002"
                disabled={Boolean(activeRequest)}
              />
            </span>
          </label>

          <button className="primary-button" disabled={isSubmitting || Boolean(activeRequest)} type="submit">
            {isSubmitting && !activeRequest ? "Sending OTP..." : "Generate OTP"}
          </button>
        </form>

        {activeRequest ? (
          <form onSubmit={submitOtp}>
            <label className="field">
              Enter OTP
              <span className="input-shell">
                <ShieldCheck size={18} />
                <input
                  value={otp}
                  onChange={(event) => setOtp(event.target.value)}
                  placeholder="6 digit OTP"
                  maxLength={6}
                />
              </span>
            </label>
            <button className="primary-button" disabled={isSubmitting || activeRequest.status === "VERIFIED"} type="submit">
              {isSubmitting ? "Verifying..." : activeRequest.status === "VERIFIED" ? "Verified" : "Verify OTP"}
            </button>
          </form>
        ) : null}

        {delivery?.developmentOtp ? (
          <p className="dev-otp-note">Development OTP: {delivery.developmentOtp}</p>
        ) : null}

        {activeRequest?.otp ? (
          <p className="helper-note">
            OTP expires {new Date(activeRequest.otp.expiresAt).toLocaleTimeString("en-IN")}. Attempts left:{" "}
            {activeRequest.otp.attemptsRemaining}.
          </p>
        ) : null}

        {success ? <p className="inline-success">{success}</p> : null}
        {error ? <p className="inline-error">{error}</p> : null}
      </section>
    </div>
  );
}
