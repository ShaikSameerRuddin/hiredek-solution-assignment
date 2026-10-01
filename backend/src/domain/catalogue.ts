import type { CatalogueRow, Clinic, Optician, Service } from "../types.js";

export function buildCatalogue(
  services: Service[],
  clinics: Clinic[],
  opticians: Optician[],
): CatalogueRow[] {
  const serviceById = new Map(services.map((service) => [service.id, service]));
  const opticianById = new Map(opticians.map((optician) => [optician.id, optician]));
  const rows: CatalogueRow[] = [];

  for (const clinic of clinics) {
    for (const opticianId of clinic.opticianIds) {
      const optician = opticianById.get(opticianId);
      if (!optician) {
        continue;
      }
      for (const serviceId of optician.serviceIds) {
        const service = serviceById.get(serviceId);
        if (!service) {
          continue;
        }
        rows.push({
          serviceId: service.id,
          serviceName: service.name,
          clinicId: clinic.id,
          clinicName: clinic.name,
          opticianId: optician.id,
          opticianName: optician.name,
        });
      }
    }
  }

  return rows.sort((left, right) =>
    `${left.serviceName}|${left.clinicName}|${left.opticianName}`.localeCompare(
      `${right.serviceName}|${right.clinicName}|${right.opticianName}`,
    ),
  );
}

export function filterCatalogue(
  rows: CatalogueRow[],
  query: { q?: string; serviceId?: string; clinicId?: string; opticianId?: string },
): CatalogueRow[] {
  const keyword = query.q?.trim().toLowerCase();
  return rows.filter((row) => {
    if (query.serviceId && row.serviceId !== query.serviceId) {
      return false;
    }
    if (query.clinicId && row.clinicId !== query.clinicId) {
      return false;
    }
    if (query.opticianId && row.opticianId !== query.opticianId) {
      return false;
    }
    if (!keyword) {
      return true;
    }
    return [row.serviceName, row.clinicName, row.opticianName]
      .join(" ")
      .toLowerCase()
      .includes(keyword);
  });
}

export function catalogueIncludes(
  rows: CatalogueRow[],
  serviceId: string,
  clinicId: string,
  opticianId: string,
): boolean {
  return rows.some(
    (row) =>
      row.serviceId === serviceId && row.clinicId === clinicId && row.opticianId === opticianId,
  );
}
