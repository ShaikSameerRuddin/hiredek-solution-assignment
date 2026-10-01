import { Select } from "antd";

export interface DropdownOption {
  value: string;
  label: string;
}

interface DropdownProps {
  value?: string;
  options: DropdownOption[];
  placeholder?: string;
  ariaLabel: string;
  onChange: (value: string | undefined) => void;
}

export function Dropdown({
  value,
  options,
  placeholder = "Select an option",
  ariaLabel,
  onChange,
}: DropdownProps) {
  return (
    <Select
      allowClear
      showSearch
      optionFilterProp="label"
      value={value}
      placeholder={placeholder}
      aria-label={ariaLabel}
      options={options}
      onChange={(next) => onChange(next)}
      style={{ width: "100%" }}
    />
  );
}
