import { NextRequest } from "next/server";
import * as ejs from "ejs";
import puppeteer from "puppeteer";
import path from "path";

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

export async function POST(req: NextRequest) {
  const body = await req.json();
  const {
    poNumber,
    poDate,
    buyer,
    supplier,
    shipTo,
    terms,
    items,
  }: {
    poNumber: string;
    poDate: string;
    buyer: PartyInfo;
    supplier: PartyInfo;
    shipTo: string;
    terms: string;
    items: Item[];
  } = body;

  const subtotal = items.reduce((sum, item) => sum + item.qty * item.price, 0);
  const totalTax = items.reduce((sum, item) => sum + (item.qty * item.price * item.tax) / 100, 0);
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
        "Content-Disposition": `attachment; filename=purchase-order.pdf`,
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
