import { makeJWT, validateJWT, hashPassword, checkPasswordHash, getBearerToken } from "./auth";
import {describe, it, expect, beforeAll } from "vitest";

describe("Password Hashing", () => {
  const password1 = "correctPassword123!";
  const password2 = "anotherPassword456!";
  let hash1: string;
  let hash2: string;

  beforeAll(async () => {
    hash1 = await hashPassword(password1);
    hash2 = await hashPassword(password2);
  });

  it("should return true for the correct password", async () => {
    const result = await checkPasswordHash(password1, hash1);
    expect(result).toBe(true);
  });
  it("should return false for the incorrect password", async () => {
    const result = await checkPasswordHash(password1, hash2);
    expect(result).toBe(false);
  });
});

describe("JWT test", () => {
  const userID = "Tester1";
  const expiresIn = 10;
  const secret = "secret";
  let jwt: string;

  beforeAll(async () => {
    jwt = makeJWT(userID, expiresIn, secret);
  });

  it("should be validated correctly", async () => {
    const result = validateJWT(jwt, secret);
    expect(result).toBe(userID);
  });
});

function makeReq(header?: string) {
  return {
    get: (name: string) =>
      name.toLowerCase() === "authorization" ? header : undefined,
  } as any;
}

describe("getBearerToken", () => {
  it("extracts token from 'Authorization: Bearer <token>'", () => {
    const req = makeReq("Bearer abc.def.ghi");
    expect(getBearerToken(req)).toBe("abc.def.ghi");
  });

  it("trims whitespace and accepts case-insensitive 'Bearer'", () => {
    const req = makeReq("bearer    token123   ");
    expect(getBearerToken(req)).toBe("token123");
  });
});
