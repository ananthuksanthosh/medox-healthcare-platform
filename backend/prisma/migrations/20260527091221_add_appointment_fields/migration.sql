/*
  Warnings:

  - Added the required column `slotDate` to the `TimeSlot` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `appointment` ADD COLUMN `cancelReason` VARCHAR(191) NULL,
    ADD COLUMN `notes` VARCHAR(191) NULL,
    ADD COLUMN `slotId` INTEGER NULL,
    ADD COLUMN `slotTime` VARCHAR(191) NULL,
    ADD COLUMN `tokenNumber` INTEGER NULL,
    ADD COLUMN `type` VARCHAR(191) NOT NULL DEFAULT 'IN_PERSON';

-- AlterTable
ALTER TABLE `doctor` ADD COLUMN `bio` VARCHAR(191) NULL,
    ADD COLUMN `isAvailable` BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN `rating` DOUBLE NULL DEFAULT 0;

-- AlterTable
ALTER TABLE `medicalreport` ADD COLUMN `description` VARCHAR(191) NULL,
    ADD COLUMN `reportType` VARCHAR(191) NULL,
    ADD COLUMN `title` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `payment` MODIFY `paymentStatus` VARCHAR(191) NOT NULL DEFAULT 'PENDING',
    MODIFY `paymentMethod` VARCHAR(191) NOT NULL DEFAULT 'ONLINE',
    MODIFY `transactionId` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `prescription` MODIFY `notes` TEXT NULL,
    MODIFY `medicines` TEXT NULL;

-- AlterTable
ALTER TABLE `timeslot` ADD COLUMN `slotDate` DATETIME(3) NOT NULL;

-- AddForeignKey
ALTER TABLE `Appointment` ADD CONSTRAINT `Appointment_slotId_fkey` FOREIGN KEY (`slotId`) REFERENCES `TimeSlot`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
