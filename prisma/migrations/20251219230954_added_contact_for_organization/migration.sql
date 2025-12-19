-- AlterTable
ALTER TABLE `Event` ADD COLUMN `coverUrl` VARCHAR(191) NULL,
    ADD COLUMN `moderationStatus` ENUM('ACTIVE', 'FLAGGED', 'HIDDEN') NOT NULL DEFAULT 'ACTIVE';

-- AlterTable
ALTER TABLE `Organization` ADD COLUMN `contactNote` VARCHAR(191) NULL,
    ADD COLUMN `coverUrl` VARCHAR(191) NULL,
    ADD COLUMN `moderationStatus` ENUM('ACTIVE', 'FLAGGED', 'HIDDEN') NOT NULL DEFAULT 'ACTIVE',
    ADD COLUMN `publicEmail` VARCHAR(191) NULL,
    ADD COLUMN `publicPhone` VARCHAR(191) NULL,
    ADD COLUMN `websiteUrl` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `Submission` ADD COLUMN `moderationStatus` ENUM('ACTIVE', 'FLAGGED', 'HIDDEN') NOT NULL DEFAULT 'ACTIVE';

-- AlterTable
ALTER TABLE `Team` ADD COLUMN `moderationStatus` ENUM('ACTIVE', 'FLAGGED', 'HIDDEN') NOT NULL DEFAULT 'ACTIVE';

-- CreateTable
CREATE TABLE `Sponsor` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `websiteUrl` VARCHAR(191) NULL,
    `description` VARCHAR(191) NULL,
    `logoKey` TEXT NULL,
    `coverKey` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Sponsor_slug_key`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `OrganizationSponsor` (
    `id` VARCHAR(191) NOT NULL,
    `orgId` VARCHAR(191) NOT NULL,
    `sponsorId` VARCHAR(191) NOT NULL,
    `tier` ENUM('TITLE', 'PLATINUM', 'GOLD', 'SILVER', 'BRONZE', 'COMMUNITY') NOT NULL DEFAULT 'COMMUNITY',
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `displayName` VARCHAR(191) NULL,
    `blurb` VARCHAR(191) NULL,
    `order` INTEGER NOT NULL DEFAULT 0,
    `logoKey` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `OrganizationSponsor_orgId_idx`(`orgId`),
    INDEX `OrganizationSponsor_sponsorId_idx`(`sponsorId`),
    INDEX `OrganizationSponsor_tier_idx`(`tier`),
    UNIQUE INDEX `OrganizationSponsor_orgId_sponsorId_key`(`orgId`, `sponsorId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `EventSponsor` (
    `id` VARCHAR(191) NOT NULL,
    `eventId` VARCHAR(191) NOT NULL,
    `sponsorId` VARCHAR(191) NOT NULL,
    `tier` ENUM('TITLE', 'PLATINUM', 'GOLD', 'SILVER', 'BRONZE', 'COMMUNITY') NOT NULL DEFAULT 'COMMUNITY',
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `displayName` VARCHAR(191) NULL,
    `blurb` VARCHAR(191) NULL,
    `order` INTEGER NOT NULL DEFAULT 0,
    `logoKey` TEXT NULL,
    `websiteUrl` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `EventSponsor_eventId_idx`(`eventId`),
    INDEX `EventSponsor_sponsorId_idx`(`sponsorId`),
    INDEX `EventSponsor_tier_idx`(`tier`),
    UNIQUE INDEX `EventSponsor_eventId_sponsorId_key`(`eventId`, `sponsorId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `OrganizationSponsor` ADD CONSTRAINT `OrganizationSponsor_orgId_fkey` FOREIGN KEY (`orgId`) REFERENCES `Organization`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `OrganizationSponsor` ADD CONSTRAINT `OrganizationSponsor_sponsorId_fkey` FOREIGN KEY (`sponsorId`) REFERENCES `Sponsor`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `EventSponsor` ADD CONSTRAINT `EventSponsor_eventId_fkey` FOREIGN KEY (`eventId`) REFERENCES `Event`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `EventSponsor` ADD CONSTRAINT `EventSponsor_sponsorId_fkey` FOREIGN KEY (`sponsorId`) REFERENCES `Sponsor`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
