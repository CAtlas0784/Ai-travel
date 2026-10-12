import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const places = [
  {
    name: "หุบป่าตาด",
    slug: "hup-pa-tat",
    description: "ถ้ำหินปูนและป่าดึกดำบรรพ์บรรยากาศลึกลับ เหมาะกับสายธรรมชาติและถ่ายภาพ",
    imageUrl: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80",
    rating: 4.8,
    openHours: "08:30 - 16:30",
    category: "ธรรมชาติ",
    entranceFee: "ประมาณ 20-50 บาท"
  },
  {
    name: "เขาสะแกกรัง",
    slug: "khao-sakae-krang",
    description: "จุดชมวิวเมืองอุทัยธานีและแม่น้ำสะแกกรัง พร้อมบรรยากาศสงบช่วงเช้าและเย็น",
    imageUrl: "https://images.unsplash.com/photo-1470770903676-69b98201ea1c?auto=format&fit=crop&w=1200&q=80",
    rating: 4.7,
    openHours: "เปิดตลอดวัน",
    category: "จุดชมวิว"
  },
  {
    name: "วัดจันทาราม (วัดท่าซุง)",
    slug: "wat-tha-sung",
    description: "วัดสำคัญที่มีวิหารแก้วสวยงาม โดดเด่นด้วยศิลปะและบรรยากาศศรัทธา",
    imageUrl: "https://images.unsplash.com/photo-1528181304800-259b08848526?auto=format&fit=crop&w=1200&q=80",
    rating: 4.9,
    openHours: "09:00 - 16:00",
    category: "วัด",
    entranceFee: "ไม่มีค่าเข้าชม"
  },
  {
    name: "น้ำตกไซเบอร์",
    slug: "cyber-waterfall",
    description: "น้ำตกกลางป่าในอำเภอห้วยคต เหมาะกับทริปพักใจและสัมผัสธรรมชาติ",
    imageUrl: "https://images.unsplash.com/photo-1432405972618-c60b0225b8f9?auto=format&fit=crop&w=1200&q=80",
    rating: 4.6,
    openHours: "08:00 - 17:00",
    category: "น้ำตก"
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
