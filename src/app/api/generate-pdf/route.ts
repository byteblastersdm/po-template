import { NextRequest } from "next/server";
import * as ejs from "ejs";
import puppeteer from "puppeteer";
import path from "path";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const {
    poNumber,
    poDate,
    buyer,       // { company, address, gstin, email, phone }
    supplier,    // { company, address, gstin, email, phone }
    shipTo,
    terms,
    items,
    
  } = body;

  const subtotal = items.reduce(
    (sum: number, item: any) => sum + item.qty * item.price,
    0
  );
  const totalTax = items.reduce(
    (sum: number, item: any) => sum + (item.qty * item.price * item.tax) / 100,
    0
  );
  const grandTotal = subtotal + totalTax;

  try {
    const templatePath = path.join(process.cwd(), "templates", "purchaseOrder.ejs");

    const html = await ejs.renderFile(templatePath, {
      logo : "https://genova-uploads.s3.ap-south-1.amazonaws.com/Genova+Icon-38+(1).png", // Replace with your logo URL
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
      headless: "new",
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
