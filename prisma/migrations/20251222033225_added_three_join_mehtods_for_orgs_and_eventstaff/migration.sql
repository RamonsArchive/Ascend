-- AlterTable
ALTER TABLE `Event` ADD COLUMN `allowStaffJoinRequests` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `staffJoinMode` ENUM('INVITE_ONLY', 'REQUEST', 'OPEN') NOT NULL DEFAULT 'INVITE_ONLY';

-- AlterTable
ALTER TABLE `Organization` ADD COLUMN `allowJoinRequests` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `joinMode` ENUM('INVITE_ONLY', 'REQUEST', 'OPEN') NOT NULL DEFAULT 'INVITE_ONLY';

-- CreateTable
CREATE TABLE `OrgInvite` (
    `id` VARCHAR(191) NOT NULL,
    `orgId` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `role` ENUM('OWNER', 'ADMIN', 'MEMBER') NOT NULL DEFAULT 'MEMBER',
    `token` VARCHAR(191) NOT NULL,
    `status` ENUM('PENDING', 'ACCEPTED', 'DECLINED', 'REVOKED', 'EXPIRED') NOT NULL DEFAULT 'PENDING',
    `message` VARCHAR(191) NULL,
    `createdByUserId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `expiresAt` DATETIME(3) NULL,

    UNIQUE INDEX `OrgInvite_token_key`(`token`),
    INDEX `OrgInvite_orgId_idx`(`orgId`),
    INDEX `OrgInvite_email_idx`(`email`),
    INDEX `OrgInvite_createdByUserId_idx`(`createdByUserId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `OrgInviteLink` (
    `id` VARCHAR(191) NOT NULL,
    `orgId` VARCHAR(191) NOT NULL,
    `token` VARCHAR(191) NOT NULL,
    `role` ENUM('OWNER', 'ADMIN', 'MEMBER') NOT NULL DEFAULT 'MEMBER',
    `status` ENUM('PENDING', 'ACCEPTED', 'DECLINED', 'REVOKED', 'EXPIRED') NOT NULL DEFAULT 'PENDING',
    `maxUses` INTEGER NULL,
    `uses` INTEGER NOT NULL DEFAULT 0,
    `expiresAt` DATETIME(3) NULL,
    `note` VARCHAR(191) NULL,
    `createdByUserId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `OrgInviteLink_token_key`(`token`),
    INDEX `OrgInviteLink_orgId_idx`(`orgId`),
    INDEX `OrgInviteLink_createdByUserId_idx`(`createdByUserId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `OrgJoinRequest` (
    `id` VARCHAR(191) NOT NULL,
    `orgId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `message` VARCHAR(191) NULL,
    `status` ENUM('PENDING', 'ACCEPTED', 'DECLINED', 'CANCELLED') NOT NULL DEFAULT 'PENDING',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `OrgJoinRequest_orgId_idx`(`orgId`),
    INDEX `OrgJoinRequest_userId_idx`(`userId`),
    INDEX `OrgJoinRequest_status_idx`(`status`),
    UNIQUE INDEX `OrgJoinRequest_orgId_userId_key`(`orgId`, `userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `EventStaffMembership` (
    `id` VARCHAR(191) NOT NULL,
    `eventId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `role` ENUM('ADMIN', 'REVIEWER', 'MENTOR', 'VOLUNTEER', 'STAFF') NOT NULL DEFAULT 'STAFF',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `EventStaffMembership_eventId_idx`(`eventId`),
    INDEX `EventStaffMembership_userId_idx`(`userId`),
    UNIQUE INDEX `EventStaffMembership_eventId_userId_key`(`eventId`, `userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `EventStaffInvite` (
    `id` VARCHAR(191) NOT NULL,
    `eventId` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `role` ENUM('ADMIN', 'REVIEWER', 'MENTOR', 'VOLUNTEER', 'STAFF') NOT NULL DEFAULT 'STAFF',
    `token` VARCHAR(191) NOT NULL,
    `status` ENUM('PENDING', 'ACCEPTED', 'DECLINED', 'REVOKED', 'EXPIRED') NOT NULL DEFAULT 'PENDING',
    `message` VARCHAR(191) NULL,
    `createdByUserId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `expiresAt` DATETIME(3) NULL,

    UNIQUE INDEX `EventStaffInvite_token_key`(`token`),
    INDEX `EventStaffInvite_eventId_idx`(`eventId`),
    INDEX `EventStaffInvite_email_idx`(`email`),
    INDEX `EventStaffInvite_createdByUserId_idx`(`createdByUserId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `EventStaffInviteLink` (
    `id` VARCHAR(191) NOT NULL,
    `eventId` VARCHAR(191) NOT NULL,
    `token` VARCHAR(191) NOT NULL,
    `role` ENUM('ADMIN', 'REVIEWER', 'MENTOR', 'VOLUNTEER', 'STAFF') NOT NULL DEFAULT 'STAFF',
    `status` ENUM('PENDING', 'ACCEPTED', 'DECLINED', 'REVOKED', 'EXPIRED') NOT NULL DEFAULT 'PENDING',
    `maxUses` INTEGER NULL,
    `uses` INTEGER NOT NULL DEFAULT 0,
    `expiresAt` DATETIME(3) NULL,
    `note` VARCHAR(191) NULL,
    `createdByUserId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `EventStaffInviteLink_token_key`(`token`),
    INDEX `EventStaffInviteLink_eventId_idx`(`eventId`),
    INDEX `EventStaffInviteLink_createdByUserId_idx`(`createdByUserId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `EventStaffJoinRequest` (
    `id` VARCHAR(191) NOT NULL,
    `eventId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `message` VARCHAR(191) NULL,
    `status` ENUM('PENDING', 'ACCEPTED', 'DECLINED', 'CANCELLED') NOT NULL DEFAULT 'PENDING',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `EventStaffJoinRequest_eventId_idx`(`eventId`),
    INDEX `EventStaffJoinRequest_userId_idx`(`userId`),
    INDEX `EventStaffJoinRequest_status_idx`(`status`),
    UNIQUE INDEX `EventStaffJoinRequest_eventId_userId_key`(`eventId`, `userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `OrgInvite` ADD CONSTRAINT `OrgInvite_orgId_fkey` FOREIGN KEY (`orgId`) REFERENCES `Organization`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `OrgInvite` ADD CONSTRAINT `OrgInvite_createdByUserId_fkey` FOREIGN KEY (`createdByUserId`) REFERENCES `user`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `OrgInviteLink` ADD CONSTRAINT `OrgInviteLink_orgId_fkey` FOREIGN KEY (`orgId`) REFERENCES `Organization`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `OrgInviteLink` ADD CONSTRAINT `OrgInviteLink_createdByUserId_fkey` FOREIGN KEY (`createdByUserId`) REFERENCES `user`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `OrgJoinRequest` ADD CONSTRAINT `OrgJoinRequest_orgId_fkey` FOREIGN KEY (`orgId`) REFERENCES `Organization`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `OrgJoinRequest` ADD CONSTRAINT `OrgJoinRequest_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `EventStaffMembership` ADD CONSTRAINT `EventStaffMembership_eventId_fkey` FOREIGN KEY (`eventId`) REFERENCES `Event`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `EventStaffMembership` ADD CONSTRAINT `EventStaffMembership_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `EventStaffInvite` ADD CONSTRAINT `EventStaffInvite_eventId_fkey` FOREIGN KEY (`eventId`) REFERENCES `Event`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `EventStaffInvite` ADD CONSTRAINT `EventStaffInvite_createdByUserId_fkey` FOREIGN KEY (`createdByUserId`) REFERENCES `user`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `EventStaffInviteLink` ADD CONSTRAINT `EventStaffInviteLink_eventId_fkey` FOREIGN KEY (`eventId`) REFERENCES `Event`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `EventStaffInviteLink` ADD CONSTRAINT `EventStaffInviteLink_createdByUserId_fkey` FOREIGN KEY (`createdByUserId`) REFERENCES `user`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `EventStaffJoinRequest` ADD CONSTRAINT `EventStaffJoinRequest_eventId_fkey` FOREIGN KEY (`eventId`) REFERENCES `Event`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `EventStaffJoinRequest` ADD CONSTRAINT `EventStaffJoinRequest_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
