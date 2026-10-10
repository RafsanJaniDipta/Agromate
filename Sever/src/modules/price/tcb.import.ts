import https from "node:https";
import tls from "node:tls";
import { unzipSync } from "fflate";

import { prisma } from "../../config/database.js";
import { CATALOG } from "./price.catalog.js";
import { SECTIGO_DV_R36_INTERMEDIATE } from "./tcb.certificate.js";

// Imports TCB's daily Dhaka retail prices. TCB lists one Excel file per day on its website;
// each file has, per item, today's lowest and highest price in columns C and D.

const LISTING_URL = "https://tcb.gov.bd/pages/daily-rmps";
const TCB_DISTRICT = "Dhaka";
const REQUEST_TIMEOUT_MS = 30_000;
const MAX_REDIRECTS = 3;

// Node's roots plus the intermediate tcb.gov.bd forgets to send
const trustedCertificates = [...tls.rootCertificates, SECTIGO_DV_R36_INTERMEDIATE];

function download(url: string, redirectsLeft = MAX_REDIRECTS): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const request = https.get(
      url,
      { ca: trustedCertificates, headers: { "User-Agent": "Mozilla/5.0 (Agromate price import)" } },
      (res) => {
        const status = res.statusCode ?? 0;
        if (status >= 300 && status < 400 && res.headers.location && redirectsLeft > 0) {
          res.resume();
          resolve(download(new URL(res.headers.location, url).toString(), redirectsLeft - 1));
          return;
        }
        if (status !== 200) {
          res.resume();
          reject(new Error(`TCB request failed: ${status} ${url}`));
          return;
        }
        const chunks: Buffer[] = [];
        res.on("data", (chunk: Buffer) => chunks.push(chunk));
        res.on("end", () => resolve(Buffer.concat(chunks)));
      },
    );
    request.setTimeout(REQUEST_TIMEOUT_MS, () => request.destroy(new Error(`TCB request timed out: ${url}`)));
    request.on("error", reject);
  });
}

type DailyFile = { date: Date; url: string };

// "10/7/2026" (month/day/year, as TCB's English column shows it) → that calendar day at UTC midnight
function parseListingDate(text: string): Date | null {
  const match = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!match) return null;
  const [, month, day, year] = match.map(Number) as [number, number, number, number];
  return new Date(Date.UTC(year, month - 1, day));
}

// The daily files on the listing page, newest first
function parseListing(html: string): DailyFile[] {
  const files: DailyFile[] = [];
  for (const row of html.split(/<tr/).slice(1)) {
    if (!row.includes("খুচরা বাজার দর")) continue;
    const url = row.match(/href="([^"]+\.xlsx)"/)?.[1];
    const dateText = row.match(/\b(\d{1,2}\/\d{1,2}\/\d{4})\b/)?.[1];
    const date = dateText ? parseListingDate(dateText) : null;
    if (url && date) files.push({ date, url });
  }
  return files.sort((a, b) => b.date.getTime() - a.date.getTime());
}

const decodeXml = (text: string) =>
  text
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&");

// Spelling-proof comparison: same Unicode form, no spaces or joiners
const normalize = (text: string) => text.normalize("NFC").replace(/[\s‌‍]/g, "");

type SheetRow = { name: string; unit: string; min: number; max: number };

// Item rows of the first sheet: name (A), unit (B), today's lowest (C) and highest (D) price
function readSheet(xlsx: Buffer): SheetRow[] {
  const files = unzipSync(new Uint8Array(xlsx));
  const text = (path: string) => new TextDecoder().decode(files[path] ?? new Uint8Array());

  const sharedStrings = [...text("xl/sharedStrings.xml").matchAll(/<si>([\s\S]*?)<\/si>/g)].map((match) =>
    decodeXml([...match[1]!.matchAll(/<t[^>]*>([^<]*)<\/t>/g)].map((part) => part[1]).join("")),
  );

  const rows: SheetRow[] = [];
  for (const [, body] of text("xl/worksheets/sheet1.xml").matchAll(/<row[^>]*>([\s\S]*?)<\/row>/g)) {
    const cells: Record<string, string> = {};
    for (const [, column, attributes, value] of body!.matchAll(
      /<c r="([A-Z]+)\d+"([^>]*)>(?:<f>[^<]*<\/f>)?(?:<v>([^<]*)<\/v>)?/g,
    )) {
      if (value !== undefined) {
        cells[column!] = /t="s"/.test(attributes!) ? (sharedStrings[Number(value)] ?? "") : value;
      }
    }
    const min = Number(cells.C);
    const max = Number(cells.D);
    if (cells.A && cells.B && min > 0 && max > 0) {
      rows.push({ name: cells.A, unit: cells.B, min, max });
    }
  }
  return rows;
}

// Saves one day's prices for the catalog's TCB items; returns how many were found
async function importDay(file: DailyFile): Promise<number> {
  const rows = readSheet(await download(file.url));
  const items = await prisma.priceItem.findMany({
    where: { slug: { in: CATALOG.filter((item) => item.tcb).map((item) => item.slug) } },
    select: { id: true, slug: true },
  });

  let saved = 0;
  for (const item of items) {
    const tcb = CATALOG.find((entry) => entry.slug === item.slug)?.tcb;
    // The summary further down the sheet repeats items, so the first match is the main table
    const row = tcb && rows.find((r) => normalize(r.name) === normalize(tcb.name) && normalize(r.unit) === normalize(tcb.unit));
    if (!row) continue;

    const key = { itemId: item.id, district: TCB_DISTRICT, date: file.date, source: "TCB" as const };
    await prisma.priceRecord.upsert({
      where: { itemId_district_date_source: key },
      update: { minPrice: row.min, maxPrice: row.max },
      create: { ...key, minPrice: row.min, maxPrice: row.max },
    });
    saved += 1;
  }
  return saved;
}

export type TcbImportResult = { importedDays: number; latestDate: Date | null };

// Imports the days of the last `days` listed files that aren't saved yet (oldest first),
// so the first run fills the trend charts and later runs only fetch the new day.
export async function importTcbPrices(days = 30): Promise<TcbImportResult> {
  // The listing shows 10 days per page (?page=2 is the 10 before)
  const files: DailyFile[] = [];
  for (let page = 1; files.length < days && page <= Math.ceil(days / 10) + 1; page += 1) {
    const pageFiles = parseListing((await download(`${LISTING_URL}?page=${page}`)).toString("utf8"));
    if (pageFiles.length === 0) break;
    files.push(...pageFiles.filter((file) => !files.some((known) => known.date.getTime() === file.date.getTime())));
  }
  files.splice(days);
  if (files.length === 0) throw new Error("No daily price files found on the TCB page");

  const saved = await prisma.priceRecord.findMany({
    where: { source: "TCB", date: { in: files.map((file) => file.date) } },
    select: { date: true },
    distinct: ["date"],
  });
  const savedDays = new Set(saved.map((record) => record.date.getTime()));

  let importedDays = 0;
  for (const file of [...files].reverse()) {
    if (savedDays.has(file.date.getTime())) continue;
    if ((await importDay(file)) > 0) importedDays += 1;
  }
  return { importedDays, latestDate: files[0]?.date ?? null };
}
