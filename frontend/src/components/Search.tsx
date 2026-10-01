import { Input } from "antd";
import { SearchOutlined } from "@ant-design/icons";

interface SearchProps {
  value: string;
  onChange: (value: string) => void;
  onSearch?: () => void;
  placeholder?: string;
  ariaLabel?: string;
}

export function Search({
  value,
  onChange,
  onSearch,
  placeholder = "Search by keywords...",
  ariaLabel = "Search by keywords",
}: SearchProps) {
  return (
    <Input
      allowClear
      value={value}
      aria-label={ariaLabel}
      placeholder={placeholder}
      prefix={<SearchOutlined />}
      onChange={(event) => onChange(event.target.value)}
      onPressEnter={onSearch}
    />
  );
}
