/*
  Warnings:

  - You are about to drop the column `coverUrl` on the `Event` table. All the data in the column will be lost.
  - You are about to drop the column `websiteUrl` on the `EventSponsor` table. All the data in the column will be lost.
  - You are about to drop the column `coverUrl` on the `Organization` table. All the data in the column will be lost.
  - You are about to drop the column `logoUrl` on the `Organization` table. All the data in the column will be lost.
  - You are about to drop the column `websiteUrl` on the `Sponsor` table. All the data in the column will be lost.
  - You are about to drop the column `imageUrls` on the `Submission` table. All the data in the column will be lost.
  - You are about to drop the column `videoUrl` on the `Submission` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `Event` DROP COLUMN `coverUrl`,
    ADD COLUMN `coverKey` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `EventSponsor` DROP COLUMN `websiteUrl`,
    ADD COLUMN `websiteKey` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `Organization` DROP COLUMN `coverUrl`,
    DROP COLUMN `logoUrl`,
    ADD COLUMN `coverKey` VARCHAR(191) NULL,
    ADD COLUMN `logoKey` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `Sponsor` DROP COLUMN `websiteUrl`,
    ADD COLUMN `websiteKey` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `Submission` DROP COLUMN `imageUrls`,
    DROP COLUMN `videoUrl`,
    ADD COLUMN `imageKeys` JSON NULL,
    ADD COLUMN `videoKey` VARCHAR(191) NULL;
