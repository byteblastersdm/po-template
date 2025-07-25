import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

function getFinancialYear(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const startYear = month >= 3 ? year : year - 1;
  const endYear = startYear + 1;
  return `${startYear}-${endYear.toString().slice(-2)}`;
}

export async function GET() {
  const fy = getFinancialYear();
  const filePath = path.resolve(process.cwd(), "po-counters.json");

  let counters: Record<string, number> = {};
  try {
    const raw = fs.readFileSync(filePath, "utf-8");
    counters = JSON.parse(raw);
  } catch (e) {
    // file doesn't exist yet
  }

  const current = counters[fy] || 0;
  const padded = String(current + 1).padStart(4, "0"); // preview next number
  const poNumber = `PO-${fy}-${padded}`;

  return NextResponse.json({ poNumber });
}
