// src/utils/jwt.ts
import jwt from "jsonwebtoken";
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET)
    throw new Error("JWT_SECRET not defined");
export function signToken(payload) {
    return jwt.sign(payload, JWT_SECRET, {
        expiresIn: "15m",
        issuer: "my-app",
    });
}
export function verifyToken(token) {
    return jwt.verify(token, JWT_SECRET);
}
