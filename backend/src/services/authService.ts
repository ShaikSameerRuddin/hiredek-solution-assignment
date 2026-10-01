import bcrypt from "bcryptjs";
import { HttpError } from "../errors.js";
import { signToken } from "../middleware/auth.js";
import type { JsonStore } from "../store/jsonStore.js";
import type { PublicUser, User } from "../types.js";

export function toPublicUser(user: User): PublicUser {
  return {
    id: user.id,
    email: user.email,
    role: user.role,
    firstName: user.firstName,
    lastName: user.lastName,
    phoneNumber: user.phoneNumber,
    birthday: user.birthday,
    opticianId: user.opticianId,
  };
}

export async function login(store: JsonStore, email: string, password: string) {
  const database = await store.read();
  const user = database.users.find((candidate) => candidate.email.toLowerCase() === email.toLowerCase());
  if (!user) {
    throw new HttpError(401, "Invalid email or password");
  }
  const matches = await bcrypt.compare(password, user.password);
  if (!matches) {
    throw new HttpError(401, "Invalid email or password");
  }
  const publicUser = toPublicUser(user);
  const token = signToken({ sub: user.id, role: user.role, email: user.email });
  return { token, user: publicUser };
}
