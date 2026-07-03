CREATE TYPE "order_status" AS ENUM ('待支付', '已支付', '已完成', '已取消');
ALTER TABLE "orders" ALTER COLUMN "status" DROP DEFAULT;
UPDATE "orders" SET "status" = '待支付' WHERE "status" NOT IN ('待支付', '已支付', '已完成', '已取消');
ALTER TABLE "orders" ALTER COLUMN "status" TYPE "order_status" USING "status"::"order_status";
ALTER TABLE "orders" ALTER COLUMN "status" SET DEFAULT '待支付'::"order_status";
