import crypto from "node:crypto";
import { readUsers, writeUsers } from "../src/services/userStore.js";
import {
  readCredentials,
  writeCredentials
} from "../src/services/credentialStore.js";
import { generatePassword, hashPassword } from "../src/utils/passwords.js";

const requestedUsers = [
  { username: "danny", role: "student", displayName: "Danny Student" },
  {
    username: "danny.instructor",
    role: "instructor",
    displayName: "Danny Instructor"
  },
  { username: "judge", role: "student", displayName: "Judge Student" },
  {
    username: "judge.instructor",
    role: "instructor",
    displayName: "Judge Instructor"
  }
];

async function main() {
  const users = await readUsers();
  const credentials = await readCredentials();

  const generated = [];

  for (const requestUser of requestedUsers) {
    let user = users.find((item) => item.username === requestUser.username);
    if (!user) {
      user = {
        id: `u_${crypto.randomUUID().replace(/-/g, "").slice(0, 12)}`,
        username: requestUser.username,
        displayName: requestUser.displayName,
        role: requestUser.role,
        active: true
      };
      users.push(user);
    } else {
      user.role = requestUser.role;
      user.displayName = requestUser.displayName;
      user.active = true;
    }

    const password = generatePassword(18);
    const passwordHash = await hashPassword(password);
    const existingCredential = credentials.find((item) => item.userId === user.id);
    const credentialRecord = {
      userId: user.id,
      passwordHash,
      passwordVersion: 1,
      mustChangePassword: true
    };

    if (existingCredential) {
      Object.assign(existingCredential, credentialRecord);
    } else {
      credentials.push(credentialRecord);
    }

    generated.push({ username: user.username, role: user.role, password });
  }

  await writeUsers(users);
  await writeCredentials(credentials);

  // eslint-disable-next-line no-console
  console.log("Seed complete. Capture these passwords now (not stored in plaintext):");
  for (const item of generated) {
    // eslint-disable-next-line no-console
    console.log(`${item.username} (${item.role}) -> ${item.password}`);
  }
}

main().catch((error) => {
  // eslint-disable-next-line no-console
  console.error("Failed to seed users.", error);
  process.exit(1);
});
