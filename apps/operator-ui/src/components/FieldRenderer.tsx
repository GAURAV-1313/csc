type Field = {
  key: string;
  type: string;
  options?: string[];
  maxLength?: number;
};

type FieldRendererProps = {
  field: Field;
  value: string | number | boolean | undefined;
  onChange: (key: string, value: string | number | boolean) => void;
  error?: string | null;
};

export default function FieldRenderer({ field, value, onChange, error }: FieldRendererProps) {
  const isPinCodeField = String(field.key || "").toLowerCase().includes("pin_code");
  const errorClass = error ? "input-error" : "";

  const commonProps = {
    value: value ?? "",
    onChange: (event) => {
      let nextValue = event.target.value;

      if (isPinCodeField) {
        nextValue = String(nextValue).replace(/\D/g, "").slice(0, 6);
      } else if (field.maxLength && typeof nextValue === "string") {
        nextValue = nextValue.slice(0, field.maxLength);
      }

      onChange(field.key, nextValue);
    }
  };

  if (field.type === "number") {
    return <input type="number" className={errorClass} {...commonProps} />;
  }

  if (field.type === "date") {
    return <input type="date" className={errorClass} {...commonProps} />;
  }

  if (field.type === "boolean") {
    return (
      <select
        className={errorClass}
        value={String(value ?? "")}
        onChange={(event) => onChange(field.key, event.target.value === "true")}
      >
        <option value="">Select</option>
        <option value="true">Yes</option>
        <option value="false">No</option>
      </select>
    );
  }

  if (field.type === "textarea") {
    return <textarea className={errorClass} {...commonProps} />;
  }

  if (field.type === "select" && Array.isArray(field.options)) {
    return (
      <select className={errorClass} {...commonProps}>
        <option value="">Select</option>
        {field.options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    );
  }

  return (
    <input
      type="text"
      className={errorClass}
      {...commonProps}
      maxLength={field.maxLength}
      inputMode={isPinCodeField ? "numeric" : undefined}
    />
  );
}
