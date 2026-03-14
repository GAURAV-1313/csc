type Field = {
  key: string;
  type: string;
  options?: string[];
};

type FieldRendererProps = {
  field: Field;
  value: string | number | boolean | undefined;
  onChange: (key: string, value: string | number | boolean) => void;
};

export default function FieldRenderer({ field, value, onChange }: FieldRendererProps) {
  const commonProps = {
    value: value ?? "",
    onChange: (event) => onChange(field.key, event.target.value)
  };

  if (field.type === "number") {
    return <input type="number" {...commonProps} />;
  }

  if (field.type === "date") {
    return <input type="date" {...commonProps} />;
  }

  if (field.type === "boolean") {
    return (
      <select value={String(value ?? "")} onChange={(event) => onChange(field.key, event.target.value === "true")}>
        <option value="">Select</option>
        <option value="true">Yes</option>
        <option value="false">No</option>
      </select>
    );
  }

  if (field.type === "textarea") {
    return <textarea {...commonProps} />;
  }

  if (field.type === "select" && Array.isArray(field.options)) {
    return (
      <select {...commonProps}>
        <option value="">Select</option>
        {field.options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    );
  }

  return <input type="text" {...commonProps} />;
}
