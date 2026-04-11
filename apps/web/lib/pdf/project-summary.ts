import PDFDocument from "pdfkit";
import { Decimal } from "@prisma/client/runtime/library";

export interface ProjectSummaryData {
  id: string;
  name: string;
  totalBudget: Decimal;
  fundedAmount: Decimal;
  closedAt: Date | null;
  contractor: { name: string; email: string } | null;
  client: { name: string; email: string } | null;
  budgetCategories: {
    id: string;
    name: string;
    allocatedAmount: Decimal;
    spentAmount: Decimal;
  }[];
  transactions: {
    id: string;
    merchantName: string;
    amount: Decimal;
    status: string;
    createdAt: Date;
    budgetCategory: { name: string } | null;
    receipts: { fileName: string }[];
  }[];
}

function formatCurrency(value: Decimal | number): string {
  const num = value instanceof Decimal ? value.toNumber() : value;
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(num);
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(date);
}

export async function generateProjectSummaryPDF(project: ProjectSummaryData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: "LETTER" });
    const chunks: Buffer[] = [];

    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    // ─── Header ─────────────────────────────────────────────────────────────
    doc.fontSize(22).font("Helvetica-Bold").text("Project Summary", { align: "center" });
    doc.moveDown(0.5);
    doc.fontSize(16).text(project.name, { align: "center" });
    doc.moveDown(0.3);

    if (project.closedAt) {
      doc.fontSize(10).font("Helvetica").fillColor("#666666")
        .text(`Closed: ${formatDate(project.closedAt)}`, { align: "center" });
    }
    doc.fillColor("#000000");
    doc.moveDown(1);

    // Parties
    doc.fontSize(10).font("Helvetica");
    const contractorLine = project.contractor
      ? `Contractor: ${project.contractor.name} (${project.contractor.email})`
      : "Contractor: —";
    const clientLine = project.client
      ? `Client: ${project.client.name} (${project.client.email})`
      : "Client: —";
    doc.text(contractorLine);
    doc.text(clientLine);
    doc.moveDown(1);

    // ─── Budget Summary ──────────────────────────────────────────────────────
    doc.fontSize(13).font("Helvetica-Bold").text("Budget Summary");
    doc.moveTo(50, doc.y).lineTo(562, doc.y).strokeColor("#cccccc").stroke();
    doc.moveDown(0.5);

    const totalSpent = project.budgetCategories.reduce(
      (sum, c) => sum + c.spentAmount.toNumber(),
      0
    );
    const totalBudget = project.totalBudget.toNumber();
    const pctUsed = totalBudget > 0 ? ((totalSpent / totalBudget) * 100).toFixed(1) : "0.0";

    doc.fontSize(10).font("Helvetica");
    doc.text(`Total Budget: ${formatCurrency(totalBudget)}`);
    doc.text(`Total Spent:  ${formatCurrency(totalSpent)}`);
    doc.text(`Remaining:    ${formatCurrency(totalBudget - totalSpent)}`);
    doc.text(`Utilization:  ${pctUsed}%`);
    doc.moveDown(1);

    // ─── Category Breakdown ──────────────────────────────────────────────────
    doc.fontSize(13).font("Helvetica-Bold").text("Category Breakdown");
    doc.moveTo(50, doc.y).lineTo(562, doc.y).strokeColor("#cccccc").stroke();
    doc.moveDown(0.5);

    // Table header
    const colX = [50, 200, 310, 400, 490];
    doc.fontSize(9).font("Helvetica-Bold");
    doc.text("Category", colX[0], doc.y, { width: 145, continued: true });
    doc.text("Allocated", colX[1], doc.y, { width: 105, align: "right", continued: true });
    doc.text("Spent", colX[2], doc.y, { width: 85, align: "right", continued: true });
    doc.text("Remaining", colX[3], doc.y, { width: 85, align: "right", continued: true });
    doc.text("% Used", colX[4], doc.y, { width: 72, align: "right" });
    doc.moveDown(0.3);

    doc.font("Helvetica").fontSize(9);
    for (const cat of project.budgetCategories) {
      const allocated = cat.allocatedAmount.toNumber();
      const spent = cat.spentAmount.toNumber();
      const remaining = allocated - spent;
      const pct = allocated > 0 ? ((spent / allocated) * 100).toFixed(1) : "0.0";
      const y = doc.y;
      doc.text(cat.name, colX[0], y, { width: 145, continued: true });
      doc.text(formatCurrency(allocated), colX[1], y, { width: 105, align: "right", continued: true });
      doc.text(formatCurrency(spent), colX[2], y, { width: 85, align: "right", continued: true });
      doc.text(formatCurrency(remaining), colX[3], y, { width: 85, align: "right", continued: true });
      doc.text(`${pct}%`, colX[4], y, { width: 72, align: "right" });
      doc.moveDown(0.4);
    }
    doc.moveDown(0.5);

    // ─── Transaction List ────────────────────────────────────────────────────
    doc.fontSize(13).font("Helvetica-Bold").text("Transactions");
    doc.moveTo(50, doc.y).lineTo(562, doc.y).strokeColor("#cccccc").stroke();
    doc.moveDown(0.5);

    if (project.transactions.length === 0) {
      doc.fontSize(9).font("Helvetica").text("No transactions recorded.");
    } else {
      // Table header
      doc.fontSize(9).font("Helvetica-Bold");
      doc.text("Date", 50, doc.y, { width: 80, continued: true });
      doc.text("Merchant", 130, doc.y, { width: 160, continued: true });
      doc.text("Category", 290, doc.y, { width: 130, continued: true });
      doc.text("Amount", 420, doc.y, { width: 80, align: "right", continued: true });
      doc.text("Receipt", 500, doc.y, { width: 62, align: "center" });
      doc.moveDown(0.3);

      doc.font("Helvetica").fontSize(9);
      for (const txn of project.transactions) {
        const y = doc.y;
        // New page if needed
        if (y > 700) {
          doc.addPage();
        }
        const hasReceipt = txn.receipts.length > 0 ? "Yes" : "No";
        doc.text(formatDate(txn.createdAt), 50, doc.y, { width: 80, continued: true });
        doc.text(txn.merchantName, 130, doc.y, { width: 160, continued: true });
        doc.text(txn.budgetCategory?.name ?? "Uncategorized", 290, doc.y, { width: 130, continued: true });
        doc.text(formatCurrency(txn.amount), 420, doc.y, { width: 80, align: "right", continued: true });
        doc.text(hasReceipt, 500, doc.y, { width: 62, align: "center" });
        doc.moveDown(0.4);
      }
    }

    doc.end();
  });
}
