import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "..", "data");

// GET /api/agent-config/files?mode=inbound        → list all files
// GET /api/agent-config/files?mode=inbound&file=x → return content of a specific file
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const mode = searchParams.get("mode");
    const fileName = searchParams.get("file");

    if (!mode || !["inbound", "outbound"].includes(mode)) {
      return NextResponse.json({ error: "mode must be 'inbound' or 'outbound'" }, { status: 400 });
    }

    const resourceDir = path.join(DATA_DIR, "resources", mode);

    // ── Single file content request ───────────────────────────────────────────
    if (fileName) {
      // Prevent path traversal
      const safeName = path.basename(fileName);
      const filePath = path.join(resourceDir, safeName);

      if (!fs.existsSync(filePath)) {
        return NextResponse.json({ error: "File not found" }, { status: 404 });
      }

      const stat = fs.statSync(filePath);
      const content = fs.readFileSync(filePath, "utf-8");
      const ext = path.extname(safeName).toLowerCase();

      return NextResponse.json({
        name: safeName,
        content,
        size: stat.size,
        modified: stat.mtime.toISOString(),
        ext,
      });
    }

    // ── List all files ────────────────────────────────────────────────────────
    if (!fs.existsSync(resourceDir)) {
      return NextResponse.json({ files: [] });
    }

    const entries = fs.readdirSync(resourceDir, { withFileTypes: true });
    const files = entries
      .filter((e) => e.isFile())
      .map((e) => {
        const filePath = path.join(resourceDir, e.name);
        const stat = fs.statSync(filePath);
        return {
          name: e.name,
          size: stat.size,
          modified: stat.mtime.toISOString(),
          ext: path.extname(e.name).toLowerCase(),
        };
      })
      .sort((a, b) => new Date(b.modified).getTime() - new Date(a.modified).getTime());

    return NextResponse.json({ files, mode });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// DELETE /api/agent-config/files?mode=inbound&file=x → delete a file from disk
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const mode = searchParams.get("mode");
    const fileName = searchParams.get("file");

    if (!mode || !["inbound", "outbound"].includes(mode)) {
      return NextResponse.json({ error: "Invalid mode" }, { status: 400 });
    }
    if (!fileName) {
      return NextResponse.json({ error: "file param required" }, { status: 400 });
    }

    const safeName = path.basename(fileName);
    const filePath = path.join(DATA_DIR, "resources", mode, safeName);

    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    fs.unlinkSync(filePath);
    return NextResponse.json({ success: true, deleted: safeName });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
