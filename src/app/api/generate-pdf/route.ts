import { NextRequest } from "next/server";
import * as ejs from "ejs";
import puppeteer from "puppeteer";
import path from "path";
import fs from "fs";

interface PartyInfo {
  company: string;
  address: string;
  gstin: string;
  email: string;
  phone: string;
}

interface Item {
  name: string;
  code: string;
  qty: number;
  price: number;
  tax: number;
}
function getFinancialYear(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const startYear = month >= 3 ? year : year - 1;
  const endYear = startYear + 1;
  return `${startYear}-${endYear.toString().slice(-2)}`;
}

function incrementPoCounter(): string {
  const fy = getFinancialYear();
  const filePath = path.resolve(process.cwd(), "po-counters.json");

  let counters: Record<string, number> = {};
  try {
    const raw = fs.readFileSync(filePath, "utf-8");
    counters = JSON.parse(raw);
  } catch (e) {
    console.error("Error reading PO counters file:", e);
    counters = {};
  }

  counters[fy] = (counters[fy] || 0) + 1;
  fs.writeFileSync(filePath, JSON.stringify(counters, null, 2));

  const padded = String(counters[fy]).padStart(4, "0");
  return `PO-${fy}-${padded}`;
}

export async function POST(req: NextRequest) {
  const body: {
    poDate: string;
    buyer: PartyInfo;
    supplier: PartyInfo;
    shipTo: PartyInfo;
    terms: string;
    poNumber: string;
    items: Item[];
  } = await req.json();
  const {
    poDate,
    buyer,
    supplier,
    shipTo,
    terms,
    poNumber,
    items,
  } = body;

  // const poNumber = incrementPoCounter(); // 🔥 this generates and saves it
  const subtotal = items.reduce((sum: number, item: Item) => sum + item.qty * item.price, 0);
  const totalTax = items.reduce((sum: number, item: Item) => sum + (item.qty * item.price * item.tax) / 100, 0);
  const grandTotal = subtotal + totalTax;

  try {
    const templatePath = path.join(process.cwd(), "templates", "purchaseOrder.ejs");
    const html = await ejs.renderFile(templatePath, {
      logo: "https://genova-uploads.s3.ap-south-1.amazonaws.com/Genova+Icon-38+(1).png",
      poNumber,
      poDate,
      buyer,
      supplier,
      shipTo,
      terms,
      items,
      subtotal,
      totalTax,
      grandTotal,
    });

    const browser = await puppeteer.launch({
      headless: "shell",
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });
    const pdf = await page.pdf({ format: "A4", printBackground: true });

    await browser.close();

    return new Response(pdf, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${poNumber}.pdf"`,
        "Content-Length": pdf.length.toString(),
        "Accept-Ranges": "bytes",
      },
    });
  } catch (err) {
    console.error("PDF generation failed:", err);
    return new Response(JSON.stringify({ error: "Failed to generate PDF" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}