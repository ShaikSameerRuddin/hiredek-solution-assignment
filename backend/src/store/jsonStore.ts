import { access, copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import bcrypt from "bcryptjs";
import type { Database } from "../types.js";

let writeChain: Promise<void> = Promise.resolve();

export function withWriteLock<T>(work: () => Promise<T>): Promise<T> {
  const run = writeChain.then(work, work);
  writeChain = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

export class JsonStore {
  constructor(
    private readonly dataDir: string,
    private readonly seedDir: string,
  ) {}

  async bootstrap(): Promise<void> {
    await mkdir(this.dataDir, { recursive: true });
    const usersPath = path.join(this.dataDir, "users.json");
    try {
      await access(usersPath);
    } catch {
      const pairs: Array<[string, string]> = [
        ["seed_data_users.json", "users.json"],
        ["seed_data_clinics.json", "clinics.json"],
        ["seed_data_opticians.json", "opticians.json"],
        ["seed_data_services.json", "services.json"],
        ["seed_data_appointments.json", "appointments.json"],
      ];
      await Promise.all(
        pairs.map(([seedName, dataName]) =>
          copyFile(path.join(this.seedDir, seedName), path.join(this.dataDir, dataName)),
        ),
      );
    }

    const users = JSON.parse(await readFile(usersPath, "utf8")) as Database["users"];
    let changed = false;
    for (const user of users) {
      if (!user.password.startsWith("$2")) {
        user.password = await bcrypt.hash(user.password, 10);
        changed = true;
      }
    }
    if (changed) {
      await writeFile(usersPath, JSON.stringify(users, null, 2));
    }
  }

  async read(): Promise<Database> {
    const load = async <T>(name: string): Promise<T> =>
      JSON.parse(await readFile(path.join(this.dataDir, name), "utf8")) as T;
    const [users, clinics, opticians, services, appointments] = await Promise.all([
      load<Database["users"]>("users.json"),
      load<Database["clinics"]>("clinics.json"),
      load<Database["opticians"]>("opticians.json"),
      load<Database["services"]>("services.json"),
      load<Database["appointments"]>("appointments.json"),
    ]);
    return { users, clinics, opticians, services, appointments };
  }

  async update(mutator: (database: Database) => void | Promise<void>): Promise<Database> {
    return withWriteLock(async () => {
      const database = await this.read();
      await mutator(database);
      await this.persist(database);
      return database;
    });
  }

  private async persist(database: Database): Promise<void> {
    const entries: Array<[string, unknown]> = [
      ["users.json", database.users],
      ["clinics.json", database.clinics],
      ["opticians.json", database.opticians],
      ["services.json", database.services],
      ["appointments.json", database.appointments],
    ];
    for (const [name, value] of entries) {
      await writeFile(path.join(this.dataDir, name), JSON.stringify(value, null, 2));
    }
  }
}
