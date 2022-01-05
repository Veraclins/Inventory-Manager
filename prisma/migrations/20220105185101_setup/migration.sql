-- CreateTable
CREATE TABLE "Item" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "Item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lot" (
    "id" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "validTill" TIMESTAMP(3) NOT NULL,
    "itemId" TEXT NOT NULL,

    CONSTRAINT "Lot_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Lot" ADD CONSTRAINT "Lot_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
