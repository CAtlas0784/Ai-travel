import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Verified against the linked official tourism listings on 2026-10-12.
// Unknown hours, fees, ratings, and photos are intentionally left blank.
const verifiedAt = new Date("2026-10-12T00:00:00.000Z");
const places = [
  {
    name: "หุบป่าตาด",
    slug: "hup-pa-tat",
    description: "ถ้ำหุบป่าตาดอยู่ในอำเภอลานสัก เป็นหุบเขาที่มีต้นตาดและอยู่ในความดูแลของเขตห้ามล่าสัตว์ป่าถ้ำประทุน",
    imageUrl: null,
    rating: null,
    openHours: null,
    category: "ธรรมชาติ",
    address: "ตำบลทุ่งนางาม อำเภอลานสัก จังหวัดอุทัยธานี 61160",
    entranceFee: "ข้อมูล ททท.: ผู้ใหญ่ชาวไทย 20 บาท เด็กชาวไทย 10 บาท ชาวต่างชาติ 200 บาท; โปรดตรวจสอบกับสถานที่ก่อนเดินทาง",
    sourceUrl: "https://thai.tourismthailand.org/Attraction/%E0%B8%96%E0%B9%89%E0%B8%B3%E0%B8%AB%E0%B8%B8%E0%B8%9A%E0%B8%9B%E0%B9%88%E0%B8%B2%E0%B8%95%E0%B8%B2%E0%B8%94",
    verifiedAt
  },
  {
    name: "เขาสะแกกรัง",
    slug: "khao-sakae-krang",
    description: "ยอดเขาสะแกกรังเป็นจุดชมวิวเมืองอุทัยธานี และเป็นที่ตั้งของมณฑปประดิษฐานรอยพระพุทธบาทจำลอง",
    imageUrl: null,
    rating: null,
    openHours: null,
    category: "จุดชมวิว",
    address: "ทางหลวงหมายเลข 3220 ตำบลอุทัยใหม่ อำเภอเมืองอุทัยธานี 61000",
    entranceFee: null,
    sourceUrl: "https://thai.tourismthailand.org/Attraction/%E0%B9%80%E0%B8%82%E0%B8%B2%E0%B8%AA%E0%B8%B0%E0%B9%81%E0%B8%81%E0%B8%81%E0%B8%A3%E0%B8%B1%E0%B8%87",
    verifiedAt
  },
  {
    name: "วัดจันทาราม (วัดท่าซุง)",
    slug: "wat-tha-sung",
    description: "วัดจันทาราม หรือวัดท่าซุง ตั้งอยู่ตำบลน้ำซึม อำเภอเมืองอุทัยธานี และมีวิหารแก้ว 100 เมตร",
    imageUrl: null,
    rating: null,
    openHours: null,
    category: "วัด",
    address: "60 หมู่ 1 ถนนอุทัยธานี-มโนรมย์ ตำบลน้ำซึม อำเภอเมืองอุทัยธานี 61000",
    entranceFee: null,
    sourceUrl: "https://thai.tourismthailand.org/Attraction/%E0%B8%A7%E0%B8%B1%E0%B8%94%E0%B8%88%E0%B8%B1%E0%B8%99%E0%B8%97%E0%B8%B2%E0%B8%A3%E0%B8%B2%E0%B8%A1-%E0%B8%A7%E0%B8%B1%E0%B8%94%E0%B8%97%E0%B9%88%E0%B8%B2%E0%B8%8B%E0%B8%B8%E0%B8%87",
    verifiedAt
  },
  {
    name: "น้ำตกไซเบอร์",
    slug: "cyber-waterfall",
    description: "น้ำตกไซเบอร์ หรือ น้ำตกหินลาด อยู่ใกล้หมู่บ้านไซเบอร์ (บ้านซับแม่บือ) อำเภอห้วยคต และอยู่ในความรับผิดชอบของหน่วยพิทักษ์ป่าไซเบอร์",
    imageUrl: null,
    rating: null,
    openHours: null,
    category: "น้ำตก",
    address: "ใกล้หมู่บ้านไซเบอร์ (บ้านซับแม่บือ) อำเภอห้วยคต จังหวัดอุทัยธานี",
    entranceFee: null,
    sourceUrl: "https://thailandtourismdirectory.go.th/attraction/3071",
    verifiedAt
  }
];

async function main() {
  for (const place of places) {
    await prisma.place.upsert({
      where: { slug: place.slug },
      create: place,
      update: place
    });
  }
}

main()
  .finally(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
