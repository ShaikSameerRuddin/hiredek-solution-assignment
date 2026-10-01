import { useState } from "react";
import { Card, Typography } from "antd";
import { ActionBar } from "../components/ActionBar";
import { AppHeader } from "../components/AppHeader";
import { Dropdown } from "../components/Dropdown";
import { Search } from "../components/Search";

const sampleOptions = [
  { value: "consult", label: "Consult" },
  { value: "exam", label: "Comprehensive Eye Exam" },
];

export function SharedComponentsPage() {
  const [search, setSearch] = useState("");
  const [applied, setApplied] = useState("");
  const [service, setService] = useState<string>();
  const [clinic, setClinic] = useState<string>();
  const [optician, setOptician] = useState<string>();
  const [single, setSingle] = useState<string>();

  return (
    <>
      <AppHeader title="Shared Components" active="shared" />
      <main id="main-content" className="page">
        <Typography.Paragraph>
          This page showcases shared components used across the application. These base components are used by the
          catalogue search. There is no obligation to reuse them outside that flow, but they keep the filters consistent.
        </Typography.Paragraph>
        <Typography.Title level={4}>Modules</Typography.Title>
        <Card title="Action Bar" style={{ marginBottom: 16 }}>
          <Typography.Paragraph type="secondary">Combined search and dropdown actions</Typography.Paragraph>
          <ActionBar
            search={search}
            onSearchChange={setSearch}
            onSearch={() => setApplied(search.trim())}
            filters={[
              {
                ariaLabel: "Sample service filter",
                placeholder: "Select Services",
                value: service,
                options: sampleOptions,
                onChange: setService,
              },
              {
                ariaLabel: "Sample clinic filter",
                placeholder: "Select Clinics",
                value: clinic,
                options: [{ value: "downtown", label: "Downtown Eye Clinic" }],
                onChange: setClinic,
              },
              {
                ariaLabel: "Sample optician filter",
                placeholder: "Select Opticians",
                value: optician,
                options: [{ value: "alice", label: "Alice Smith" }],
                onChange: setOptician,
              },
            ]}
          />
          <Typography.Text type="secondary">Applied keyword: {applied || "none"}</Typography.Text>
        </Card>
        <Card title="Search" style={{ marginBottom: 16 }}>
          <Typography.Paragraph type="secondary">Search input component</Typography.Paragraph>
          <Search value={search} onChange={setSearch} ariaLabel="Shared search example" />
        </Card>
        <Card title="Dropdown">
          <Typography.Paragraph type="secondary">Single list of options in a menu</Typography.Paragraph>
          <Dropdown
            ariaLabel="Shared dropdown example"
            value={single}
            options={sampleOptions}
            onChange={setSingle}
          />
        </Card>
      </main>
    </>
  );
}
