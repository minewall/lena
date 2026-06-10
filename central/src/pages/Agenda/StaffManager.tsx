import { type FormEvent, useEffect, useState } from "react";
import {
  createStaff,
  loadAllStaff,
  nextColor,
  STAFF_COLORS,
  updateStaff,
  type Staff,
} from "../../lib/staff";
import { Button, Field, StatusPill, TextInput } from "../../components/ui";

interface Props {
  tenantId: string;
  onClose: () => void;
  onChanged: () => void;
}

export function StaffManager({ tenantId, onClose, onChanged }: Props) {
  const [list, setList] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [newRole, setNewRole] = useState("");
  const [newColor, setNewColor] = useState("");
  const [saving, setSaving] = useState(false);

  async function reload() {
    try {
      const s = await loadAllStaff(tenantId);
      setList(s);
      setNewColor(nextColor(s.map((x) => x.color)));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { reload(); }, [tenantId]);

  async function addStaff(e: FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    setSaving(true);
    try {
      await createStaff(tenantId, newName, newRole, newColor, list.length);
      setNewName(""); setNewRole("");
      await reload();
      onChanged();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(s: Staff) {
    try {
      await updateStaff(s.id, { active: !s.active });
      await reload(); onChanged();
    } catch (err) { setError((err as Error).message); }
  }

  async function changeColor(s: Staff, color: string) {
    try {
      await updateStaff(s.id, { color });
      await reload(); onChanged();
    } catch (err) { setError((err as Error).message); }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-end bg-cafe/20 pt-12 pr-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="flex w-96 flex-col gap-4 rounded-2xl border border-creme-edge bg-white p-5 shadow-2xl">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl text-cafe">Profissionais</h2>
          <button type="button" onClick={onClose} className="text-cafe-muted hover:text-cafe">✕</button>
        </div>

        {error ? <StatusPill kind="error">{error}</StatusPill> : null}

        {loading ? (
          <p className="text-cafe-soft animate-pulse-soft">carregando…</p>
        ) : (
          <ul className="flex flex-col divide-y divide-creme-edge">
            {list.length === 0 && (
              <li className="py-3 text-sm text-cafe-muted">
                Nenhum profissional ainda. Adicione abaixo.
              </li>
            )}
            {list.map((s) => (
              <li key={s.id} className="flex items-center gap-3 py-3">
                {/* seletor de cor */}
                <div className="relative">
                  <div
                    className="h-6 w-6 cursor-pointer rounded-full border-2 border-white shadow"
                    style={{ backgroundColor: s.color }}
                    title="Trocar cor"
                  />
                  <select
                    value={s.color}
                    onChange={(e) => changeColor(s, e.target.value)}
                    className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                  >
                    {STAFF_COLORS.map((c) => (
                      <option key={c.hex} value={c.hex}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${s.active ? "text-cafe" : "text-cafe-muted line-through"}`}>
                    {s.name}
                  </p>
                  {s.role && <p className="text-xs text-cafe-muted">{s.role}</p>}
                </div>
                <button
                  type="button"
                  onClick={() => toggleActive(s)}
                  className={`rounded-full px-2.5 py-0.5 text-xs ${
                    s.active
                      ? "bg-salvia-soft text-salvia hover:bg-terracota-soft hover:text-terracota"
                      : "bg-creme-edge text-cafe-muted hover:bg-salvia-soft hover:text-salvia"
                  }`}
                >
                  {s.active ? "Ativo" : "Inativo"}
                </button>
              </li>
            ))}
          </ul>
        )}

        {/* adicionar novo */}
        <form onSubmit={addStaff} className="flex flex-col gap-3 border-t border-creme-edge pt-4">
          <p className="text-xs font-medium text-cafe-soft uppercase tracking-wide">
            Adicionar profissional
          </p>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Nome">
              <TextInput
                required
                placeholder="Dr. João"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
              />
            </Field>
            <Field label="Função (opcional)">
              <TextInput
                placeholder="Médico, Tosador…"
                value={newRole}
                onChange={(e) => setNewRole(e.target.value)}
              />
            </Field>
          </div>
          <Field label="Cor na agenda">
            <div className="flex flex-wrap gap-2">
              {STAFF_COLORS.map((c) => (
                <button
                  key={c.hex}
                  type="button"
                  title={c.name}
                  onClick={() => setNewColor(c.hex)}
                  className={`h-7 w-7 rounded-full border-2 transition ${
                    newColor === c.hex ? "border-cafe scale-110" : "border-transparent"
                  }`}
                  style={{ backgroundColor: c.hex }}
                />
              ))}
            </div>
          </Field>
          <Button type="submit" disabled={saving || !newName.trim()}>
            {saving ? "Adicionando…" : "+ Adicionar"}
          </Button>
        </form>
      </div>
    </div>
  );
}
