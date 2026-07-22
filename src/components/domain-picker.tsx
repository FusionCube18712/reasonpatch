import type { DomainId } from "@/features/coach/contracts";

const DOMAINS: ReadonlyArray<
  Readonly<{ id: DomainId; title: string; description: string }>
> = [
  {
    id: "formal-logic",
    title: "Formal logic",
    description: "Proof rules and scope",
  },
  {
    id: "algebra",
    title: "Algebra",
    description: "Steps and solution sets",
  },
  {
    id: "python",
    title: "Python",
    description: "Behavior and edge cases",
  },
  {
    id: "causal-reasoning",
    title: "Causal reasoning",
    description: "Claims and evidence",
  },
] as const;

export function DomainPicker({
  value,
  onChange,
  disabled = false,
}: Readonly<{
  value: DomainId;
  onChange: (domain: DomainId) => void;
  disabled?: boolean;
}>) {
  return (
    <fieldset>
      <legend className="mb-3 text-sm font-semibold text-[#20201d]">
        What are you working on?
      </legend>
      <div className="grid grid-cols-2 gap-2">
        {DOMAINS.map((domain) => {
          const selected = value === domain.id;
          return (
            <label
              key={domain.id}
              className={`relative flex min-h-20 flex-col justify-center rounded-[14px] border px-4 py-3 transition focus-within:ring-3 focus-within:ring-[#3557c4] focus-within:ring-offset-2 ${
                disabled ? "cursor-not-allowed opacity-70" : "cursor-pointer"
              } ${
                selected
                  ? "border-[#3557c4] bg-[#e9edfa] text-[#20201d]"
                  : "border-[#b8afa3] bg-[#fbf8f1] text-[#69645d] hover:border-[#3557c4]"
              }`}
            >
              <input
                type="radio"
                name="reasoning-domain"
                value={domain.id}
                checked={selected}
                disabled={disabled}
                onChange={() => onChange(domain.id)}
                className="sr-only"
              />
              <span className="text-sm font-semibold">{domain.title}</span>
              <span className="mt-1 text-xs leading-5">{domain.description}</span>
              {selected ? (
                <span
                  aria-hidden="true"
                  className="absolute inset-x-3 bottom-0 h-1 rounded-t-full bg-[#3557c4]"
                />
              ) : null}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
