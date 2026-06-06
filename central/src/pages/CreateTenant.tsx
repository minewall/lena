import { type FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuth } from "../store/auth";

function slugify(input: string) {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 60);
}

const SEGMENTS = [
  { value: "escola", label: "Escola" },
  { value: "clinica", label: "Clínica" },
  { value: "salao", label: "Salão / Estética" },
  { value: "petshop", label: "Petshop" },
  { value: "outro", label: "Outro" },
];

export function CreateTenant() {
  const navigate = useNavigate();
  const loadTenants = useAuth((s) => s.loadTenants);
  const setCurrentTenant = useAuth((s) => s.setCurrentTenant);

  const [name, setName] = useState("");
  const [segment, setSegment] = useState("escola");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function onNameChange(value: string) {
    setName(value);
    if (!slugTouched) setSlug(slugify(value));
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);

    const { data, error } = await supabase.rpc("create_tenant", {
      p_name: name.trim(),
      p_slug: slug.trim(),
      p_segment: segment,
    });

    setSaving(false);

    if (error) {
      setError(error.message);
      return;
    }

    await loadTenants();
    if (typeof data === "string") {
      setCurrentTenant(data);
    }
    navigate("/", { replace: true });
  }

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="text-3xl text-cafe">Crie o seu negócio na Lena</h1>
      <p className="mt-2 text-cafe-soft">
        Esses dados básicos já permitem a Lena começar a responder no perfil
        certo. Você refina o cérebro dela depois.
      </p>

      <form onSubmit={onSubmit} className="mt-8 flex flex-col gap-5">
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-cafe-soft">Nome do negócio</span>
          <input
            required
            type="text"
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            placeholder="Ex.: Colégio Adventista Campo Belo"
            className="rounded-xl border border-creme-edge bg-white px-3 py-2 text-cafe outline-none focus:border-terracota"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="text-cafe-soft">Segmento</span>
          <select
            value={segment}
            onChange={(e) => setSegment(e.target.value)}
            className="rounded-xl border border-creme-edge bg-white px-3 py-2 text-cafe outline-none focus:border-terracota"
          >
            {SEGMENTS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="text-cafe-soft">
            Slug{" "}
            <span className="text-cafe-muted">
              (URL interna; sugerido a partir do nome)
            </span>
          </span>
          <input
            required
            type="text"
            value={slug}
            onChange={(e) => {
              setSlug(slugify(e.target.value));
              setSlugTouched(true);
            }}
            className="rounded-xl border border-creme-edge bg-white px-3 py-2 text-cafe outline-none focus:border-terracota"
          />
        </label>

        {error ? (
          <p className="text-sm text-terracota-dark">{error}</p>
        ) : null}

        <button
          type="submit"
          disabled={saving || !name.trim() || !slug.trim()}
          className="self-start rounded-xl bg-terracota px-5 py-2.5 font-medium text-white transition hover:bg-terracota-dark disabled:opacity-60"
        >
          {saving ? "criando…" : "Criar negócio"}
        </button>
      </form>
    </div>
  );
}
