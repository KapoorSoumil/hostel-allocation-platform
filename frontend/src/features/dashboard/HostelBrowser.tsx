import { useEffect, useMemo, useState } from "react";
import {
  Bed,
  Building2,
  CheckCircle2,
  DoorOpen,
  Eye,
  Filter,
  Layers3,
  Search,
  UsersRound,
  X
} from "lucide-react";
import { allocateRoom, getHostelRooms, getRoomDetail } from "../../lib/api";
import type {
  Allocation,
  AllocationStatus,
  HostelBlock,
  HostelRoomSummary,
  RoomCategory,
  RoomDetail,
  RoomListItem
} from "../../lib/types";

type HostelBrowserProps = {
  token: string;
  hostels: HostelBlock[];
  categories: RoomCategory[];
  initialAllocation: Allocation | null;
  allocationStatus: AllocationStatus;
  realtimeVersion: number;
  onAllocated: (allocation: Allocation) => void;
};

export function HostelBrowser({
  token,
  hostels,
  categories,
  initialAllocation,
  allocationStatus,
  realtimeVersion,
  onAllocated
}: HostelBrowserProps) {
  const [selectedHostelId, setSelectedHostelId] = useState(hostels[0]?.id ?? "");
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [search, setSearch] = useState("");
  const [rooms, setRooms] = useState<RoomListItem[]>([]);
  const [summary, setSummary] = useState<HostelRoomSummary | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<RoomDetail | null>(null);
  const [isLoadingRooms, setIsLoadingRooms] = useState(true);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [isAllocating, setIsAllocating] = useState(false);
  const [allocation, setAllocation] = useState<Allocation | null>(initialAllocation);
  const [error, setError] = useState("");

  const selectedHostel = useMemo(
    () => hostels.find((hostel) => hostel.id === selectedHostelId) ?? hostels[0],
    [hostels, selectedHostelId]
  );

  useEffect(() => {
    if (!selectedHostelId && hostels[0]) {
      setSelectedHostelId(hostels[0].id);
    }
  }, [hostels, selectedHostelId]);

  useEffect(() => {
    if (!selectedHostelId) {
      return;
    }

    setIsLoadingRooms(true);

    const request = window.setTimeout(async () => {
      setError("");

      try {
        const response = await getHostelRooms(token, selectedHostelId, {
          categoryId: selectedCategoryId || undefined,
          search: search || undefined
        });
        setRooms(response.data.rooms);
        setSummary(response.data.summary);
        setSelectedRoom(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not load rooms");
      } finally {
        setIsLoadingRooms(false);
      }
    }, 250);

    return () => window.clearTimeout(request);
  }, [token, selectedHostelId, selectedCategoryId, search, realtimeVersion]);

  async function openRoom(roomId: string) {
    setIsLoadingDetail(true);
    setError("");

    try {
      const response = await getRoomDetail(token, roomId);
      setSelectedRoom(response.data.room);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load room details");
    } finally {
      setIsLoadingDetail(false);
    }
  }

  async function confirmAllocation(room: RoomDetail) {
    const isConfirmed = window.confirm(
      `Confirm allocation for Room ${room.roomNumber} in ${room.hostelBlock.name}?`
    );

    if (!isConfirmed) {
      return;
    }

    setIsAllocating(true);
    setError("");

    try {
      const response = await allocateRoom(token, room.id);
      setAllocation(response.data.allocation);
      onAllocated(response.data.allocation);
      const [roomsResponse, detailResponse] = await Promise.all([
        getHostelRooms(token, selectedHostelId, {
          categoryId: selectedCategoryId || undefined,
          search: search || undefined
        }),
        getRoomDetail(token, room.id)
      ]);
      setRooms(roomsResponse.data.rooms);
      setSummary(roomsResponse.data.summary);
      setSelectedRoom(detailResponse.data.room);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not allocate room");
    } finally {
      setIsAllocating(false);
    }
  }

  return (
    <section className="browse-section" id="hostel-browser">
      <div className="browse-header">
        <div>
          <p className="eyebrow">Hostel browsing</p>
          <h2>Find available rooms</h2>
        </div>
        <div className="browse-summary" aria-label="Selected hostel availability">
          <span>{summary?.availableBeds ?? selectedHostel?.availableBeds ?? 0}</span>
          <small>beds open</small>
        </div>
      </div>

      <div className="browser-layout">
        <aside className="hostel-list" aria-label="Hostel blocks">
          {hostels.map((hostel) => (
            <button
              className={`hostel-select-card ${hostel.id === selectedHostelId ? "is-selected" : ""}`}
              key={hostel.id}
              onClick={() => setSelectedHostelId(hostel.id)}
              type="button"
            >
              <span className="hostel-select-icon">
                <Building2 size={19} />
              </span>
              <span>
                <strong>{hostel.name}</strong>
                <small>{hostel.availableBeds} beds open</small>
              </span>
            </button>
          ))}
        </aside>

        <section className="room-browser-panel">
          <div className="filter-bar">
            <label className="search-box">
              <Search size={18} />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search room number"
              />
            </label>

            <label className="select-box">
              <Filter size={18} />
              <select
                value={selectedCategoryId}
                onChange={(event) => setSelectedCategoryId(event.target.value)}
              >
                <option value="">All categories</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {selectedHostel ? (
            <div className="selected-hostel-strip">
              <div>
                <h3>{selectedHostel.name}</h3>
                <p>{selectedHostel.description}</p>
              </div>
              <div className="strip-metrics">
                <span>
                  <DoorOpen size={16} /> {summary?.totalRooms ?? selectedHostel.totalRooms} rooms
                </span>
                <span>
                  <UsersRound size={16} /> {summary?.availableBeds ?? selectedHostel.availableBeds} beds open
                </span>
              </div>
            </div>
          ) : null}

          {error ? <p className="inline-error">{error}</p> : null}

          <div className="room-content-grid">
            <div className="room-card-grid" aria-busy={isLoadingRooms}>
              {isLoadingRooms ? (
                <RoomSkeleton />
              ) : rooms.length ? (
                rooms.map((room) => (
                  <RoomCard
                    key={room.id}
                    room={room}
                    isSelected={selectedRoom?.id === room.id}
                    onOpen={() => openRoom(room.id)}
                  />
                ))
              ) : (
                <div className="empty-rooms">
                  <Bed size={24} />
                  <strong>No matching rooms</strong>
                  <span>Try a different category or room number.</span>
                </div>
              )}
            </div>

            <RoomDetailsPanel
              isLoading={isLoadingDetail}
              isAllocating={isAllocating}
              room={selectedRoom}
              allocation={allocation}
              allocationStatus={allocationStatus}
              onClose={() => setSelectedRoom(null)}
              onAllocate={confirmAllocation}
            />
          </div>
        </section>
      </div>
    </section>
  );
}

function RoomCard({
  room,
  isSelected,
  onOpen
}: {
  room: RoomListItem;
  isSelected: boolean;
  onOpen: () => void;
}) {
  const occupancy = room.capacity
    ? Math.round((room.currentOccupancy / room.capacity) * 100)
    : 0;

  return (
    <article className={`room-card ${isSelected ? "is-selected" : ""}`}>
      <div className="room-card-top">
        <span className="room-number">Room {room.roomNumber}</span>
        <span className={`room-state ${room.isAvailable ? "is-open" : "is-full"}`}>
          {room.isAvailable ? "Open" : "Full"}
        </span>
      </div>
      <div className="room-card-main">
        <div>
          <p>{room.category.name}</p>
          <strong>{room.availableBeds}</strong>
          <span>available beds</span>
        </div>
        <div className="mini-bed-stack" aria-label={`${room.currentOccupancy} of ${room.capacity} occupied`}>
          {Array.from({ length: room.capacity }).map((_, index) => (
            <span key={index} className={index < room.currentOccupancy ? "occupied" : ""} />
          ))}
        </div>
      </div>
      <div className="room-card-footer">
        <span>
          <Layers3 size={15} /> Floor {room.floor ?? "NA"}
        </span>
        <button onClick={onOpen} type="button">
          <Eye size={15} /> Details
        </button>
      </div>
      <div className="progress-track" aria-hidden="true">
        <div style={{ width: `${occupancy}%` }} />
      </div>
    </article>
  );
}

function RoomDetailsPanel({
  room,
  isLoading,
  isAllocating,
  allocation,
  allocationStatus,
  onClose,
  onAllocate
}: {
  room: RoomDetail | null;
  isLoading: boolean;
  isAllocating: boolean;
  allocation: Allocation | null;
  allocationStatus: AllocationStatus;
  onClose: () => void;
  onAllocate: (room: RoomDetail) => void;
}) {
  if (isLoading) {
    return (
      <aside className="room-detail-panel">
        <div className="loading-line" />
        <div className="loading-line short" />
        <div className="loading-box" />
      </aside>
    );
  }

  if (!room) {
    return (
      <aside className="room-detail-panel empty-detail">
        <DoorOpen size={28} />
        <strong>Select a room</strong>
        <span>Room details and occupancy will appear here.</span>
      </aside>
    );
  }

  const occupancy = room.capacity
    ? Math.round((room.currentOccupancy / room.capacity) * 100)
    : 0;
  const canAllocateRoom = allocationStatus.canAllocate && room.isAvailable && !allocation;

  return (
    <aside className="room-detail-panel">
      <div className="detail-heading">
        <div>
          <p className="eyebrow">Room details</p>
          <h3>Room {room.roomNumber}</h3>
        </div>
        <button onClick={onClose} type="button" title="Close details">
          <X size={18} />
        </button>
      </div>

      <div className="detail-metric-grid">
        <div>
          <span>Category</span>
          <strong>{room.category.name}</strong>
        </div>
        <div>
          <span>Floor</span>
          <strong>{room.floor ?? "NA"}</strong>
        </div>
        <div>
          <span>Capacity</span>
          <strong>{room.capacity}</strong>
        </div>
        <div>
          <span>Available</span>
          <strong>{room.availableBeds}</strong>
        </div>
      </div>

      <div>
        <div className="detail-row">
          <span>Occupancy</span>
          <strong>{occupancy}%</strong>
        </div>
        <div className="progress-track detail-progress" aria-hidden="true">
          <div style={{ width: `${occupancy}%` }} />
        </div>
      </div>

      <div className="occupant-list">
        <h4>Current occupants</h4>
        {room.occupants.length ? (
          room.occupants.map((occupant) => (
            <div key={occupant.id}>
              <strong>{occupant.name}</strong>
              <span>
                {occupant.registrationNumber}
                {occupant.department ? `, ${occupant.department}` : ""}
              </span>
            </div>
          ))
        ) : (
          <p>No occupants yet.</p>
        )}
      </div>

      {allocation?.room.id === room.id ? (
        <div className="allocation-success-mini">
          <CheckCircle2 size={18} />
          <span>Allocated to you</span>
        </div>
      ) : (
        <button
          className="primary-button allocation-button"
          disabled={!canAllocateRoom || isAllocating}
          onClick={() => onAllocate(room)}
          type="button"
        >
          <CheckCircle2 size={18} />
          {isAllocating ? "Allocating..." : allocation ? "Already allocated" : "Confirm allocation"}
        </button>
      )}

      {!allocationStatus.canAllocate && !allocation ? (
        <p className="helper-note">
          Allocation opens only during your active counseling slot.
        </p>
      ) : null}
    </aside>
  );
}

function RoomSkeleton() {
  return (
    <>
      {Array.from({ length: 6 }).map((_, index) => (
        <div className="room-skeleton" key={index}>
          <div className="loading-line" />
          <div className="loading-line short" />
          <div className="loading-box" />
        </div>
      ))}
    </>
  );
}
