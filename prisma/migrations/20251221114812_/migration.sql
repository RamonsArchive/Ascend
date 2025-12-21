-- AlterTable
ALTER TABLE `Sponsor` ADD COLUMN `createdById` VARCHAR(191) NULL,
    ADD COLUMN `visibility` ENUM('PRIVATE', 'PUBLIC') NOT NULL DEFAULT 'PRIVATE';

-- CreateIndex
CREATE INDEX `Sponsor_createdById_idx` ON `Sponsor`(`createdById`);

-- AddForeignKey
ALTER TABLE `Sponsor` ADD CONSTRAINT `Sponsor_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `user`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
