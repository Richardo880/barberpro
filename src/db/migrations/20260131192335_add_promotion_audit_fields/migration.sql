-- AlterTable
ALTER TABLE "haircut_records" ADD COLUMN     "discountAmount" DECIMAL(10,2),
ADD COLUMN     "originalPrice" DECIMAL(10,2),
ADD COLUMN     "promotionApplied" BOOLEAN NOT NULL DEFAULT false;
