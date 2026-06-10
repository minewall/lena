import { useState } from "react";
import {
  assignStaff,
  cancelAppointment,
  fmtHHMM,
  requestReschedule,
  updateAppointmentStatus,
  type Appointment,
} from "../../lib/agenda";
import { type Staff } from "../../lib/staff";

interface Props {
  appt: Appointment;
  staffList: Staff[];
  compact?: boolean;           // visão compacta (semana/mês)
  style?: React.CSSProperties; // para posicionamento absoluto no dia
  onChanged: () => void;
  onDragStart?: () => void;
  onDragEnd?: () => void;
}

const STATUS_DOT: Record<string, string> = {
  booked:    "bg-sky-400",
  confirmed: "bg-salvia",
  cancelled: "bg-terracota",
  no_show:   "bg-cafe-muted",
  done:      "bg-creme-edge",
};

export function AppointmentCard({
  appt,
  staffList,
  compact = false,
  style,
  onChanged,
  onDragStart,
  onDragEnd,
}: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ text: string; kind: "ok" | "warn" | "err" } | null>(null);

  const color = appt.staff?.color ?? "#897866";
  const name =
    appt.contact?.name?.trim() ||
    appt.customer_name?.trim() ||
    appt.contact?.phone_e164 ||
    "Cliente";
  const service = appt.service?.name ?? "";
  const startT = fmtHHMM(new Date(appt.starts_at));
  const endT   = fmtHHMM(new Date(appt.ends_at));
  const isActive = appt.status === "booked" || appt.status === "confirmed";

  async function handleReschedule() {
    setLoading(true);
    setMsg(null);
    try {
      const r = await requestReschedule(appt.id);
      if (!r.ok) { setMsg({ text: "Erro ao solicitar", kind: "err" }); return; }
      if (r.window_open) {
        setMsg({ text: "Lena vai contatar o cliente pelo WhatsApp.", kind: "ok" });
      } else {
        const phone = r.contact_phone
          ? ` Ligue: ${r.contact_phone}`
          : "";
        setMsg({ text: `Janela WhatsApp fechada (>24h).${phone}`, kind: "warn" });
      }
      onChanged();
    } catch {
      setMsg({ text: "Erro de rede", kind: "err" });
    } finally {
      setLoading(false);
    }
  }

  async function handleStatus(s: Appointment["status"]) {
    setLoading(true);
    try { await updateAppointmentStatus(appt.id, s); onChanged(); }
    catch { setMsg({ text: "Erro ao atualizar", kind: "err" }); }
    finally { setLoading(false); }
  }

  async function handleStaff(staffId: string) {
    setLoading(true);
    try { await assignStaff(appt.id, staffId || null); onChanged(); }
    catch { setMsg({ text: "Erro ao trocar", kind: "err" }); }
    finally { setLoading(false); }
  }

  async function handleCancel() {
    if (!confirm(`Cancelar o agendamento de ${name}?`)) return;
    setLoading(true);
    try { await cancelAppointment(appt.id, "cancelado pela equipe"); onChanged(); }
    catch { setMsg({ text: "Erro", kind: "err" }); }
    finally { setLoading(false); }
  }

  if (compact) {
    return (
      <div
        style={{ borderLeftColor: color }}
        className="cursor-pointer truncate rounded-md border-l-2 bg-white px-2 py-0.5 text-xs text-cafe shadow-sm hover:shadow"
        onClick={() => setOpen(true)}
      >
        {startT} {name}
        {open && (
          <FullCard
            appt={appt} name={name} service={service}
            startT={startT} endT={endT} color={color}
            staffList={staffList} isActive={isActive}
            loading={loading} msg={msg}
            onReschedule={handleReschedule}
            onStatus={handleStatus}
            onStaff={handleStaff}
            onCancel={handleCancel}
            onClose={() => { setOpen(false); setMsg(null); }}
          />
        )}
      </div>
    );
  }

  return (
    <>
      <div
        draggable={isActive}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        style={{ ...style, borderLeftColor: color, backgroundColor: color + "18" }}
        className={`absolute left-0.5 right-0.5 overflow-hidden rounded-lg border-l-4 px-2 py-1 text-xs shadow-sm transition
          ${isActive ? "cursor-grab hover:shadow-md active:opacity-60" : "opacity-50 cursor-default"}`}
        onClick={() => setOpen(true)}
      >
        <div className="font-medium text-cafe truncate">{startT} {name}</div>
        {service && <div className="truncate text-cafe-soft">{service}</div>}
        {appt.staff && (
          <div className="truncate text-cafe-muted">{appt.staff.name}</div>
        )}
        <span
          className={`mt-0.5 inline-block h-1.5 w-1.5 rounded-full ${STATUS_DOT[appt.status] ?? "bg-creme-edge"}`}
        />
      </div>

      {open && (
        <FullCard
          appt={appt} name={name} service={service}
          startT={startT} endT={endT} color={color}
          staffList={staffList} isActive={isActive}
          loading={loading} msg={msg}
          onReschedule={handleReschedule}
          onStatus={handleStatus}
          onStaff={handleStaff}
          onCancel={handleCancel}
          onClose={() => { setOpen(false); setMsg(null); }}
        />
      )}
    </>
  );
}

// ── painel lateral expandido ───────────────────────────────────────────

function FullCard({
  appt, name, service, startT, endT, color, staffList, isActive,
  loading, msg, onReschedule, onStatus, onStaff, onCancel, onClose,
}: {
  appt: Appointment; name: string; service: string;
  startT: string; endT: string; color: string;
  staffList: Staff[]; isActive: boolean; loading: boolean;
  msg: { text: string; kind: "ok" | "warn" | "err" } | null;
  onReschedule: () => void; onStatus: (s: Appointment["status"]) => void;
  onStaff: (id: string) => void; onCancel: () => void; onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-end bg-cafe/20 pt-12 pr-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="flex w-80 flex-col gap-3 rounded-2xl border border-creme-edge bg-white p-4 shadow-2xl">
        {/* header */}
        <div className="flex items-start justify-between gap-2">
          <div>
            <div
              className="h-1 w-8 rounded-full mb-2"
              style={{ backgroundColor: color }}
            />
            <p className="font-display text-lg leading-tight text-cafe">{name}</p>
            <p className="text-xs text-cafe-muted">
              {startT} – {endT}
              {service ? ` · ${service}` : ""}
            </p>
          </div>
          <button type="button" onClick={onClose} className="text-cafe-muted hover:text-cafe">✕</button>
        </div>

        {/* dados coletados pela Lena */}
        {appt.notes && (
          <div className="rounded-xl bg-creme p-3 text-xs text-cafe-soft">
            <p className="mb-1 text-[10px] uppercase tracking-wide text-cafe-muted">Da Lena</p>
            {appt.notes}
          </div>
        )}

        {/* profissional atual */}
        {staffList.length > 0 && (
          <div className="flex flex-col gap-1">
            <p className="text-[10px] uppercase tracking-wide text-cafe-muted">Profissional</p>
            <select
              value={appt.staff_id ?? ""}
              onChange={(e) => onStaff(e.target.value)}
              disabled={loading}
              className="rounded-xl border border-creme-edge bg-white px-3 py-1.5 text-sm text-cafe"
            >
              <option value="">— sem profissional —</option>
              {staffList.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}{s.role ? ` (${s.role})` : ""}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* status */}
        {isActive && (
          <div className="flex gap-2">
            <button
              type="button"
              disabled={loading}
              onClick={() => onStatus("confirmed")}
              className="flex-1 rounded-xl border border-salvia bg-salvia-soft py-1.5 text-xs font-medium text-salvia hover:bg-salvia hover:text-white disabled:opacity-50"
            >
              ✓ Confirmar
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={() => onStatus("done")}
              className="flex-1 rounded-xl border border-creme-edge py-1.5 text-xs text-cafe-soft hover:bg-creme-soft disabled:opacity-50"
            >
              ✔ Realizado
            </button>
          </div>
        )}

        {/* remarcar */}
        {isActive && (
          <button
            type="button"
            disabled={loading || !!appt.reschedule_requested_at}
            onClick={onReschedule}
            className="rounded-xl bg-terracota px-4 py-2 text-sm font-medium text-white hover:bg-terracota-dark disabled:opacity-50"
          >
            {appt.reschedule_requested_at ? "⏳ Reagendamento solicitado" : "📅 Remarcar pela Lena"}
          </button>
        )}

        {msg && (
          <p className={`rounded-xl px-3 py-2 text-xs ${
            msg.kind === "ok"   ? "bg-salvia-soft text-salvia" :
            msg.kind === "warn" ? "bg-amber-50 text-amber-700" :
                                  "bg-terracota-soft text-terracota-dark"
          }`}>
            {msg.text}
          </p>
        )}

        {/* cancelar */}
        {isActive && (
          <button
            type="button"
            disabled={loading}
            onClick={onCancel}
            className="text-xs text-terracota underline hover:text-terracota-dark disabled:opacity-50"
          >
            Cancelar agendamento
          </button>
        )}
      </div>
    </div>
  );
}
