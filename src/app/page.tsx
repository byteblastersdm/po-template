"use client";

import { useState } from "react";
import Head from "next/head";
import Image from "next/image";

interface Item {
  name: string;
  code: string;
  qty: number;
  price: number;
  tax: number;
}

export default function Home() {
  const [items, setItems] = useState<Item[]>([{ name: "", code: "", qty: 1, price: 0, tax: 18 }]);
  const [poNumber, setPoNumber] = useState("PO-000123");
  const [poDate, setPoDate] = useState(new Date().toISOString().substring(0, 10));
  const [buyerInfo, setBuyerInfo] = useState({ company: "", address: "", gstin: "", email: "", phone: "" });
  const [supplierInfo, setSupplierInfo] = useState({ company: "", address: "", gstin: "", email: "", phone: "" });
  const [shipTo, setShipTo] = useState("");
  const [terms, setTerms] = useState("");

  const handleItemChange = (index: number, field: keyof Item, value: string | number) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    setItems(updated);
  };

  const addItem = () => {
    setItems([...items, { name: "", code: "", qty: 1, price: 0, tax: 18 }]);
  };

  const subtotal = items.reduce((sum, item) => sum + item.qty * item.price, 0);
  const totalTax = items.reduce((sum, item) => sum + (item.qty * item.price * item.tax) / 100, 0);
  const grandTotal = subtotal + totalTax;

  const downloadPDF = async () => {
    const data = {
      poNumber,
      poDate,
      buyer: buyerInfo,
      supplier: supplierInfo,
      shipTo,
      terms,
      items,
    };

    const res = await fetch("/api/generate-pdf", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "purchase-order.pdf";
    link.click();
  };

  return (
    <>
      <Head>
        <title>Purchase Order</title>
      </Head>
      <main className="p-6 bg-gray-100 min-h-screen print:bg-white">
        <div className="max-w-5xl mx-auto bg-white p-6 rounded shadow print:shadow-none print:border print:p-10">
          <div className="flex justify-between items-center mb-6">
            <div>
              <Image
                src="https://genova-uploads.s3.ap-south-1.amazonaws.com/Genova+Icon-38+(1).png"
                height={100}
                width={100}
                alt="Company Logo"
              />
              <p className="text-sm mt-2 text-gray-600">
                Your Company Name<br />
                123 Main Street<br />
                GSTIN: 27XXXXX1234X1Z1
              </p>
            </div>
            <div className="text-right space-y-2">
              <h1 className="text-3xl font-bold text-[#007bdb]">PURCHASE ORDER</h1>
              <input type="text" value={poNumber} onChange={(e) => setPoNumber(e.target.value)} className="input text-right" placeholder="PO Number" />
              <input type="date" value={poDate} onChange={(e) => setPoDate(e.target.value)} className="input text-right" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6 mb-6">
            <div className="space-y-2">
              <h2 className="font-semibold">Buyer Information</h2>
              <input className="input" placeholder="Company Name" onChange={(e) => setBuyerInfo({ ...buyerInfo, company: e.target.value })} />
              <input className="input" placeholder="Address" onChange={(e) => setBuyerInfo({ ...buyerInfo, address: e.target.value })} />
              <input className="input" placeholder="GSTIN" onChange={(e) => setBuyerInfo({ ...buyerInfo, gstin: e.target.value })} />
              <input className="input" placeholder="Email" onChange={(e) => setBuyerInfo({ ...buyerInfo, email: e.target.value })} />
              <input className="input" placeholder="Phone" onChange={(e) => setBuyerInfo({ ...buyerInfo, phone: e.target.value })} />
            </div>
            <div className="space-y-2">
              <h2 className="font-semibold">Supplier Information</h2>
              <input className="input" placeholder="Supplier Name" onChange={(e) => setSupplierInfo({ ...supplierInfo, company: e.target.value })} />
              <input className="input" placeholder="Supplier Address" onChange={(e) => setSupplierInfo({ ...supplierInfo, address: e.target.value })} />
              <input className="input" placeholder="Supplier GSTIN" onChange={(e) => setSupplierInfo({ ...supplierInfo, gstin: e.target.value })} />
              <input className="input" placeholder="Supplier Email" onChange={(e) => setSupplierInfo({ ...supplierInfo, email: e.target.value })} />
              <input className="input" placeholder="Supplier Phone" onChange={(e) => setSupplierInfo({ ...supplierInfo, phone: e.target.value })} />
            </div>
          </div>

          <div className="mb-4">
            <h2 className="font-semibold">Ship To</h2>
            <textarea className="input w-full" rows={2} placeholder="Shipping address details" onChange={(e) => setShipTo(e.target.value)} />
          </div>

          <table className="w-full border text-sm mb-4">
            <thead className="bg-[#007bdb] text-white">
              <tr>
                <th className="p-2 border">#</th>
                <th className="p-2 border">Product</th>
                <th className="p-2 border">Code</th>
                <th className="p-2 border">Qty</th>
                <th className="p-2 border">Price</th>
                <th className="p-2 border">Tax %</th>
                <th className="p-2 border">Line Total</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, i) => {
                const line = item.qty * item.price;
                const taxAmt = (line * item.tax) / 100;
                return (
                  <tr key={i}>
                    <td className="border p-2">{i + 1}</td>
                    <td className="border p-2"><input className="input" value={item.name} onChange={(e) => handleItemChange(i, "name", e.target.value)} /></td>
                    <td className="border p-2"><input className="input" value={item.code} onChange={(e) => handleItemChange(i, "code", e.target.value)} /></td>
                    <td className="border p-2"><input type="number" className="input" value={item.qty} onChange={(e) => handleItemChange(i, "qty", parseFloat(e.target.value))} /></td>
                    <td className="border p-2"><input type="number" className="input" value={item.price} onChange={(e) => handleItemChange(i, "price", parseFloat(e.target.value))} /></td>
                    <td className="border p-2">
                      <select className="input" value={item.tax} onChange={(e) => handleItemChange(i, "tax", parseFloat(e.target.value))}>
                        {[0, 5, 12, 18, 28].map(t => <option key={t} value={t}>{t}%</option>)}
                      </select>
                    </td>
                    <td className="border p-2">₹{(line + taxAmt).toFixed(2)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <button onClick={addItem} className="btn bg-[#007bdb] text-white px-4 py-2 rounded mb-6 print:hidden">
            + Add Item
          </button>

          <div className="text-right text-sm mb-10">
            <p><strong>Subtotal:</strong> ₹{subtotal.toFixed(2)}</p>
            <p><strong>Total Tax:</strong> ₹{totalTax.toFixed(2)}</p>
            <p className="text-lg text-[#007bdb]"><strong>Grand Total:</strong> ₹{grandTotal.toFixed(2)}</p>
          </div>

          <div className="mb-10">
            <h2 className="font-semibold">Terms & Conditions</h2>
            <textarea className="input w-full" rows={4} placeholder="Enter your terms here..." onChange={(e) => setTerms(e.target.value)} />
          </div>

          <div className="text-center print:hidden">
            <button onClick={downloadPDF} className="bg-[#007bdb] text-white px-6 py-2 rounded shadow hover:bg-[#0063b1]">
              🖨️ Print Purchase Order
            </button>
          </div>
        </div>
      </main>
    </>
  );
}
