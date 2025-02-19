import { NextRequest, NextResponse } from "next/server";
import { chromium, Browser } from "playwright-core";
import fs from "fs";
import path from "path";

let browserInstance: Browser | null = null;

export const POST = async (req: NextRequest) => {
  try {
    const body = await req.json();
    const { url, usecases } = body;

    if (!url || !Array.isArray(usecases) || usecases.length === 0) {
      return NextResponse.json(
        { error: "Missing parameters or invalid usecases format" },
        { status: 400 }
      );
    }

    if (!browserInstance) {
      browserInstance = await chromium.launch({
        headless: true,
        args: ["--no-sandbox", "--disable-dev-shm-usage"],
      });
    }

    const context = await browserInstance.newContext();
    const page = await context.newPage();
    await page.goto(url, { waitUntil: "domcontentloaded" });

    let results: { action: string; message: string }[] = [];
    let extractedTexts: string[] = [];
    let screenshotUrls: string[] = [];
    let screenshotPaths: string[] = [];

    try {
      for (let i = 0; i < usecases.length; i++) {
        const { action, selector, value } = usecases[i];
        let resultMessage = "";

        if (action === "klik" && selector) {
          const element = await page.$(selector);
          if (element) {
            await element.click();
            resultMessage = `✅ Berhasil klik ${selector}`;

            // Screenshot setelah klik
            const screenshotPath = path.join(
              process.cwd(),
              "public",
              `screenshot_klik_${i + 1}.png`
            );
            await page.screenshot({ path: screenshotPath });
            screenshotUrls.push(`/screenshot_klik_${i + 1}.png`);
            screenshotPaths.push(screenshotPath);
          } else {
            resultMessage = `❌ Gagal, elemen ${selector} tidak ditemukan`;
          }
        } else if (action === "input" && selector && value) {
          const element = await page.$(selector);
          if (element) {
            await element.fill(value);
            resultMessage = `✅ Berhasil mengisi ${selector} dengan "${value}"`;

            // Screenshot setelah input
            const screenshotPath = path.join(
              process.cwd(),
              "public",
              `screenshot_input_${i + 1}.png`
            );
            await page.screenshot({ path: screenshotPath });
            screenshotUrls.push(`/screenshot_input_${i + 1}.png`);
            screenshotPaths.push(screenshotPath);
          } else {
            resultMessage = `❌ Gagal, elemen ${selector} tidak ditemukan`;
          }
        } else if (action === "cek" && selector) {
          const elements = await page.$$(selector);
          if (elements.length > 0) {
            extractedTexts = await Promise.all(
              elements.map(async (el) => (await el.textContent()) || "")
            );
            resultMessage = `✅ Teks ditemukan pada ${selector}`;

            // Screenshot untuk setiap elemen teks yang ditemukan
            for (let j = 0; j < elements.length; j++) {
              const screenshotPath = path.join(
                process.cwd(),
                "public",
                `screenshot_teks_${i + 1}_${j + 1}.png`
              );
              await elements[j].screenshot({ path: screenshotPath });
              screenshotUrls.push(`/screenshot_teks_${i + 1}_${j + 1}.png`);
              screenshotPaths.push(screenshotPath);
            }
          } else {
            resultMessage = `❌ Tidak ditemukan elemen dengan selector ${selector}`;
          }
        } else {
          resultMessage =
            "❌ Use case tidak dikenali atau parameter kurang lengkap";
        }

        results.push({
          action: `${action} ${selector || ""}`,
          message: resultMessage,
        });
      }
    } catch (error: any) {
      results.push({
        action: "error",
        message: `❌ Error saat menjalankan use cases: ${error.message}`,
      });
    }

    await page.close();
    await context.close();

    // Hapus semua screenshot setelah ditampilkan di frontend
    setTimeout(() => {
      for (const screenshotPath of screenshotPaths) {
        try {
          if (fs.existsSync(screenshotPath)) {
            fs.unlinkSync(screenshotPath);
          }
        } catch (error) {
          console.error(`Gagal menghapus file ${screenshotPath}:`, error);
        }
      }
    }, 5000); // Hapus setelah 5 detik agar bisa ditampilkan dulu di frontend

    return NextResponse.json({
      status: "success",
      results,
      extractedTexts,
      screenshotUrls,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
};
