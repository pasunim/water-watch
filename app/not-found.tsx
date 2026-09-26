import Link from "next/link";
import { Wordmark } from "@/components/SiteChrome";

export default function NotFound() {
  return (
    <main className="flex flex-1 items-center justify-center px-6 py-24">
      <div className="flex max-w-md flex-col items-center gap-4 text-center">
        <Wordmark />
        <div className="eyebrow pt-4">404</div>
        <h1 className="section-title">ไม่พบหน้านี้</h1>
        <p className="text-sm font-light leading-relaxed text-ink-muted">หน้าที่คุณเปิดไม่มีอยู่ในเว็บนี้ ข้อมูลสถานการณ์น้ำทั้งหมดอยู่ที่หน้าแรก</p>
        <Link href="/" className="mt-2 inline-flex h-12 items-center rounded-full bg-ink px-6 font-medium text-white transition-colors hover:bg-black">
          กลับหน้าแรก
        </Link>
      </div>
    </main>
  );
}
