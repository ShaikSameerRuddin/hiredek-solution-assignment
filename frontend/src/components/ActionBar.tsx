import { Button } from "antd";
import { SearchOutlined } from "@ant-design/icons";
import { Dropdown, type DropdownOption } from "./Dropdown";
import { Search } from "./Search";

export interface ActionFilter {
  ariaLabel: string;
  placeholder: string;
  value?: string;
  options: DropdownOption[];
  onChange: (value: string | undefined) => void;
}

interface ActionBarProps {
  search: string;
  onSearchChange: (value: string) => void;
  onSearch: () => void;
  filters: ActionFilter[];
}

export function ActionBar({ search, onSearchChange, onSearch, filters }: ActionBarProps) {
  return (
    <div className="action-bar">
      <Search value={search} onChange={onSearchChange} onSearch={onSearch} />
      {filters.map((filter) => (
        <Dropdown key={filter.ariaLabel} {...filter} />
      ))}
      <Button type="primary" aria-label="Search catalogue" icon={<SearchOutlined />} onClick={onSearch} />
    </div>
  );
}
