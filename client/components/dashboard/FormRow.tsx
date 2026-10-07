import { darkLabel } from "@/components/dashboard/formStyles";

type FormRowProps = {
  id: string;
  label: string;
  children: React.ReactNode;
};

// Label above an input (and any hint under it), for the dark dashboard forms
export default function FormRow({ id, label, children }: FormRowProps) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className={darkLabel}>
        {label}
      </label>
      {children}
    </div>
  );
}
