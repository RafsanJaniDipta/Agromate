// Throwaway diagnostic: exercises the phone register/login endpoints.
const BASE = "http://localhost:5000";

async function post(path: string, body: unknown) {
  const res = await fetch(BASE + path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(body),
  });
  let json: unknown = null;
  try { json = await res.json(); } catch { /* empty */ }
  return { status: res.status, setCookie: res.headers.getSetCookie?.() ?? [], json };
}

const stamp = Date.now().toString().slice(-6);
const phone = `0171${stamp}00`; // 11 digits, unique

console.log("=== register (new) ===");
const r1 = await post("/api/auth/register", { name: "Test Farmer", phone, password: "Testpass123", locale: "en", role: "FARMER" });
console.log(r1.status, JSON.stringify(r1.json));

console.log("=== register (duplicate phone) ===");
const r2 = await post("/api/auth/register", { name: "Duplicate", phone, password: "Testpass123", role: "FARMER" });
console.log(r2.status, JSON.stringify(r2.json));

console.log("=== login (just registered) ===");
const r3 = await post("/api/auth/login", { phone, password: "Testpass123" });
console.log(r3.status, JSON.stringify(r3.json), "cookies:", r3.setCookie.length);

console.log("=== login (wrong password) ===");
const r4 = await post("/api/auth/login", { phone, password: "Wrongpass123" });
console.log(r4.status, JSON.stringify(r4.json));

console.log("=== login (seeded farmer, 01700112233) ===");
const r5 = await post("/api/auth/login", { phone: "01700112233", password: "Farmer@12345" });
console.log(r5.status, JSON.stringify(r5.json), "cookies:", r5.setCookie.length);

console.log("=== register (expert, no specialization) ===");
const r6 = await post("/api/auth/register", { name: "No Spec", phone: `0181${stamp}00`, password: "Testpass123", role: "EXPERT" });
console.log(r6.status, JSON.stringify(r6.json));

console.log("=== register (short password) ===");
const r7 = await post("/api/auth/register", { name: "Short", phone: `0191${stamp}00`, password: "short", role: "FARMER" });
console.log(r7.status, JSON.stringify(r7.json));