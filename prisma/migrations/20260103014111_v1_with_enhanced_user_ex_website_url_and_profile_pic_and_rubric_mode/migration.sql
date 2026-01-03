/*
  Warnings:

  - The values [REVIEWER,MENTOR,VOLUNTEER] on the enum `EventStaffInviteLink_role` will be removed. If these variants are still used in the database, this will fail.
  - The values [REVIEWER,MENTOR,VOLUNTEER] on the enum `EventStaffInviteLink_role` will be removed. If these variants are still used in the database, this will fail.
  - The values [REVIEWER,MENTOR,VOLUNTEER] on the enum `EventStaffInviteLink_role` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `breakdown` on the `Score` table. All the data in the column will be lost.
  - You are about to drop the column `track` on the `Team` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[eventId,slug]` on the table `Team` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[username]` on the table `user` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `createdByUserId` to the `Event` table without a default value. This is not possible if the table is not empty.
  - Added the required column `slug` to the `Team` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `Submission` DROP FOREIGN KEY `Submission_teamId_fkey`;

-- AlterTable
ALTER TABLE `Event` ADD COLUMN `createdByUserId` VARCHAR(191) NOT NULL,
    ADD COLUMN `locationAddress` VARCHAR(191) NULL DEFAULT '',
    ADD COLUMN `locationLat` DOUBLE NULL DEFAULT 0,
    ADD COLUMN `locationLng` DOUBLE NULL DEFAULT 0,
    ADD COLUMN `locationMapUrl` VARCHAR(191) NULL DEFAULT '',
    ADD COLUMN `locationName` VARCHAR(191) NULL DEFAULT '',
    ADD COLUMN `locationNotes` VARCHAR(191) NULL DEFAULT '',
    ADD COLUMN `rubricMode` ENUM('NONE', 'OPTIONAL', 'REQUIRED') NOT NULL DEFAULT 'NONE',
    ADD COLUMN `rubricScaleMax` INTEGER NOT NULL DEFAULT 10;

-- AlterTable
ALTER TABLE `EventParticipant` MODIFY `lookingForTeam` BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE `EventStaffInvite` MODIFY `role` ENUM('ADMIN', 'JUDGE', 'STAFF') NOT NULL DEFAULT 'STAFF';

-- AlterTable
ALTER TABLE `EventStaffInviteLink` MODIFY `role` ENUM('ADMIN', 'JUDGE', 'STAFF') NOT NULL DEFAULT 'STAFF';

-- AlterTable
ALTER TABLE `EventStaffMembership` MODIFY `role` ENUM('ADMIN', 'JUDGE', 'STAFF') NOT NULL DEFAULT 'STAFF';

-- AlterTable
ALTER TABLE `OrganizationSponsor` ADD COLUMN `websiteKey` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `Score` DROP COLUMN `breakdown`;

-- AlterTable
ALTER TABLE `Submission` ADD COLUMN `demoUrl` TEXT NULL,
    ADD COLUMN `repoUrl` TEXT NULL,
    ADD COLUMN `slidesUrl` TEXT NULL;

-- AlterTable
ALTER TABLE `Team` DROP COLUMN `track`,
    ADD COLUMN `slug` VARCHAR(191) NOT NULL,
    ADD COLUMN `trackId` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `user` ADD COLUMN `bannerKey` VARCHAR(191) NULL,
    ADD COLUMN `bioRich` JSON NULL,
    ADD COLUMN `bioText` TEXT NULL,
    ADD COLUMN `discord` TEXT NULL,
    ADD COLUMN `githubUrl` TEXT NULL,
    ADD COLUMN `headline` TEXT NULL,
    ADD COLUMN `linkedinUrl` TEXT NULL,
    ADD COLUMN `location` TEXT NULL,
    ADD COLUMN `profilePicKey` VARCHAR(191) NULL,
    ADD COLUMN `username` VARCHAR(191) NULL,
    ADD COLUMN `websiteUrl` TEXT NULL,
    ADD COLUMN `youtubeUrl` TEXT NULL;

-- CreateTable
CREATE TABLE `EventInviteLink` (
    `id` VARCHAR(191) NOT NULL,
    `eventId` VARCHAR(191) NOT NULL,
    `token` VARCHAR(191) NOT NULL,
    `status` ENUM('PENDING', 'ACCEPTED', 'DECLINED', 'REVOKED', 'EXPIRED') NOT NULL DEFAULT 'PENDING',
    `maxUses` INTEGER NULL,
    `uses` INTEGER NOT NULL DEFAULT 0,
    `expiresAt` DATETIME(3) NULL,
    `note` VARCHAR(191) NULL,
    `createdByUserId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `EventInviteLink_token_key`(`token`),
    INDEX `EventInviteLink_eventId_idx`(`eventId`),
    INDEX `EventInviteLink_createdByUserId_idx`(`createdByUserId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `EventEmailInvite` (
    `id` VARCHAR(191) NOT NULL,
    `eventId` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `token` VARCHAR(191) NOT NULL,
    `status` ENUM('PENDING', 'ACCEPTED', 'DECLINED', 'REVOKED', 'EXPIRED') NOT NULL DEFAULT 'PENDING',
    `message` VARCHAR(191) NULL,
    `createdByUserId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `expiresAt` DATETIME(3) NULL,

    UNIQUE INDEX `EventEmailInvite_token_key`(`token`),
    INDEX `EventEmailInvite_eventId_idx`(`eventId`),
    INDEX `EventEmailInvite_email_idx`(`email`),
    INDEX `EventEmailInvite_createdByUserId_idx`(`createdByUserId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `EventAward` (
    `id` VARCHAR(191) NOT NULL,
    `eventId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `blurb` VARCHAR(191) NULL,
    `allowMultipleWinners` BOOLEAN NOT NULL DEFAULT false,
    `order` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `EventAward_eventId_idx`(`eventId`),
    UNIQUE INDEX `EventAward_eventId_name_key`(`eventId`, `name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AwardAssignment` (
    `id` VARCHAR(191) NOT NULL,
    `eventId` VARCHAR(191) NOT NULL,
    `awardId` VARCHAR(191) NOT NULL,
    `teamId` VARCHAR(191) NULL,
    `submissionId` VARCHAR(191) NULL,
    `rank` INTEGER NULL,
    `assignedByUserId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `AwardAssignment_eventId_idx`(`eventId`),
    INDEX `AwardAssignment_awardId_idx`(`awardId`),
    INDEX `AwardAssignment_assignedByUserId_idx`(`assignedByUserId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `EventTrack` (
    `id` VARCHAR(191) NOT NULL,
    `eventId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `blurb` VARCHAR(191) NULL,
    `order` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `EventTrack_eventId_idx`(`eventId`),
    UNIQUE INDEX `EventTrack_eventId_name_key`(`eventId`, `name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `EventRubricCategory` (
    `id` VARCHAR(191) NOT NULL,
    `eventId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `weight` INTEGER NOT NULL DEFAULT 1,
    `order` INTEGER NOT NULL DEFAULT 0,

    INDEX `EventRubricCategory_eventId_idx`(`eventId`),
    UNIQUE INDEX `EventRubricCategory_eventId_name_key`(`eventId`, `name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ScoreCategory` (
    `id` VARCHAR(191) NOT NULL,
    `scoreId` VARCHAR(191) NOT NULL,
    `categoryId` VARCHAR(191) NOT NULL,
    `value` INTEGER NOT NULL,
    `comment` TEXT NULL,

    INDEX `ScoreCategory_scoreId_idx`(`scoreId`),
    INDEX `ScoreCategory_categoryId_idx`(`categoryId`),
    UNIQUE INDEX `ScoreCategory_scoreId_categoryId_key`(`scoreId`, `categoryId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE UNIQUE INDEX `Team_eventId_slug_key` ON `Team`(`eventId`, `slug`);

-- CreateIndex
CREATE UNIQUE INDEX `user_username_key` ON `user`(`username`);

-- CreateIndex
CREATE INDEX `user_username_idx` ON `user`(`username`);

-- AddForeignKey
ALTER TABLE `Event` ADD CONSTRAINT `Event_createdByUserId_fkey` FOREIGN KEY (`createdByUserId`) REFERENCES `user`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `EventInviteLink` ADD CONSTRAINT `EventInviteLink_createdByUserId_fkey` FOREIGN KEY (`createdByUserId`) REFERENCES `user`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `EventInviteLink` ADD CONSTRAINT `EventInviteLink_eventId_fkey` FOREIGN KEY (`eventId`) REFERENCES `Event`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `EventEmailInvite` ADD CONSTRAINT `EventEmailInvite_createdByUserId_fkey` FOREIGN KEY (`createdByUserId`) REFERENCES `user`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `EventEmailInvite` ADD CONSTRAINT `EventEmailInvite_eventId_fkey` FOREIGN KEY (`eventId`) REFERENCES `Event`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `EventAward` ADD CONSTRAINT `EventAward_eventId_fkey` FOREIGN KEY (`eventId`) REFERENCES `Event`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AwardAssignment` ADD CONSTRAINT `AwardAssignment_assignedByUserId_fkey` FOREIGN KEY (`assignedByUserId`) REFERENCES `user`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AwardAssignment` ADD CONSTRAINT `AwardAssignment_eventId_fkey` FOREIGN KEY (`eventId`) REFERENCES `Event`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AwardAssignment` ADD CONSTRAINT `AwardAssignment_awardId_fkey` FOREIGN KEY (`awardId`) REFERENCES `EventAward`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AwardAssignment` ADD CONSTRAINT `AwardAssignment_teamId_fkey` FOREIGN KEY (`teamId`) REFERENCES `Team`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AwardAssignment` ADD CONSTRAINT `AwardAssignment_submissionId_fkey` FOREIGN KEY (`submissionId`) REFERENCES `Submission`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `EventTrack` ADD CONSTRAINT `EventTrack_eventId_fkey` FOREIGN KEY (`eventId`) REFERENCES `Event`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Team` ADD CONSTRAINT `Team_trackId_fkey` FOREIGN KEY (`trackId`) REFERENCES `EventTrack`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Submission` ADD CONSTRAINT `Submission_teamId_fkey` FOREIGN KEY (`teamId`) REFERENCES `Team`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `EventRubricCategory` ADD CONSTRAINT `EventRubricCategory_eventId_fkey` FOREIGN KEY (`eventId`) REFERENCES `Event`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ScoreCategory` ADD CONSTRAINT `ScoreCategory_scoreId_fkey` FOREIGN KEY (`scoreId`) REFERENCES `Score`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ScoreCategory` ADD CONSTRAINT `ScoreCategory_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `EventRubricCategory`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
