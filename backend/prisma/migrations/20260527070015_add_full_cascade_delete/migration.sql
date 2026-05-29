-- DropForeignKey
ALTER TABLE `payment` DROP FOREIGN KEY `Payment_appointmentId_fkey`;

-- DropForeignKey
ALTER TABLE `prescription` DROP FOREIGN KEY `Prescription_appointmentId_fkey`;

-- DropForeignKey
ALTER TABLE `timeslot` DROP FOREIGN KEY `TimeSlot_doctorId_fkey`;

-- DropIndex
DROP INDEX `TimeSlot_doctorId_fkey` ON `timeslot`;

-- AddForeignKey
ALTER TABLE `Payment` ADD CONSTRAINT `Payment_appointmentId_fkey` FOREIGN KEY (`appointmentId`) REFERENCES `Appointment`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Prescription` ADD CONSTRAINT `Prescription_appointmentId_fkey` FOREIGN KEY (`appointmentId`) REFERENCES `Appointment`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TimeSlot` ADD CONSTRAINT `TimeSlot_doctorId_fkey` FOREIGN KEY (`doctorId`) REFERENCES `Doctor`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
