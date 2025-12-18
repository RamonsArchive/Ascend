-- CreateTable
CREATE TABLE `User` (
    `id` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NULL,
    `imageUrl` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `User_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Organization` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `logoUrl` VARCHAR(191) NULL,
    `description` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Organization_slug_key`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `OrgMembership` (
    `id` VARCHAR(191) NOT NULL,
    `orgId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `role` ENUM('OWNER', 'ADMIN', 'MEMBER') NOT NULL DEFAULT 'MEMBER',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `OrgMembership_userId_idx`(`userId`),
    INDEX `OrgMembership_orgId_idx`(`orgId`),
    UNIQUE INDEX `OrgMembership_orgId_userId_key`(`orgId`, `userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Event` (
    `id` VARCHAR(191) NOT NULL,
    `orgId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `type` ENUM('IDEATHON', 'HACKATHON') NOT NULL,
    `status` ENUM('DRAFT', 'PUBLISHED', 'ARCHIVED') NOT NULL DEFAULT 'DRAFT',
    `heroTitle` VARCHAR(191) NOT NULL,
    `heroSubtitle` VARCHAR(191) NULL,
    `rulesRich` JSON NULL,
    `rubricRich` JSON NULL,
    `startAt` DATETIME(3) NULL,
    `endAt` DATETIME(3) NULL,
    `submitDueAt` DATETIME(3) NULL,
    `requireImages` BOOLEAN NOT NULL DEFAULT false,
    `requireVideoDemo` BOOLEAN NOT NULL DEFAULT false,
    `visibility` ENUM('PUBLIC_LISTED', 'PUBLIC_UNLISTED', 'PRIVATE') NOT NULL DEFAULT 'PUBLIC_LISTED',
    `joinMode` ENUM('OPEN', 'REQUEST', 'INVITE_ONLY') NOT NULL DEFAULT 'OPEN',
    `registrationOpensAt` DATETIME(3) NULL,
    `registrationClosesAt` DATETIME(3) NULL,
    `maxTeamSize` INTEGER NOT NULL DEFAULT 5,
    `lockTeamChangesAtStart` BOOLEAN NOT NULL DEFAULT true,
    `allowSelfJoinRequests` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Event_orgId_idx`(`orgId`),
    UNIQUE INDEX `Event_orgId_slug_key`(`orgId`, `slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `EventRegistrationRequest` (
    `id` VARCHAR(191) NOT NULL,
    `eventId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `message` VARCHAR(191) NULL,
    `status` ENUM('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED') NOT NULL DEFAULT 'PENDING',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `reviewedAt` DATETIME(3) NULL,
    `reviewedByUserId` VARCHAR(191) NULL,

    INDEX `EventRegistrationRequest_eventId_idx`(`eventId`),
    INDEX `EventRegistrationRequest_userId_idx`(`userId`),
    INDEX `EventRegistrationRequest_status_idx`(`status`),
    UNIQUE INDEX `EventRegistrationRequest_eventId_userId_key`(`eventId`, `userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `EventParticipant` (
    `id` VARCHAR(191) NOT NULL,
    `eventId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `status` ENUM('REGISTERED', 'WITHDRAWN') NOT NULL DEFAULT 'REGISTERED',
    `newsletterOptIn` BOOLEAN NOT NULL DEFAULT false,
    `contactEmail` VARCHAR(191) NULL,
    `lookingForTeam` BOOLEAN NOT NULL DEFAULT true,
    `trackPreference` VARCHAR(191) NULL,
    `skills` JSON NULL,
    `interests` JSON NULL,
    `experienceLevel` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `EventParticipant_eventId_idx`(`eventId`),
    INDEX `EventParticipant_userId_idx`(`userId`),
    UNIQUE INDEX `EventParticipant_eventId_userId_key`(`eventId`, `userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SubmissionSchema` (
    `id` VARCHAR(191) NOT NULL,
    `eventId` VARCHAR(191) NOT NULL,
    `fields` JSON NOT NULL,

    UNIQUE INDEX `SubmissionSchema_eventId_key`(`eventId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Team` (
    `id` VARCHAR(191) NOT NULL,
    `eventId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `blurb` VARCHAR(191) NULL,
    `track` VARCHAR(191) NULL,
    `lookingForMembers` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Team_eventId_idx`(`eventId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TeamMember` (
    `id` VARCHAR(191) NOT NULL,
    `eventId` VARCHAR(191) NOT NULL,
    `teamId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `role` ENUM('LEADER', 'MEMBER') NOT NULL DEFAULT 'MEMBER',

    INDEX `TeamMember_eventId_idx`(`eventId`),
    INDEX `TeamMember_userId_idx`(`userId`),
    UNIQUE INDEX `TeamMember_teamId_userId_key`(`teamId`, `userId`),
    UNIQUE INDEX `TeamMember_eventId_userId_key`(`eventId`, `userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TeamInvite` (
    `id` VARCHAR(191) NOT NULL,
    `eventId` VARCHAR(191) NOT NULL,
    `teamId` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `token` VARCHAR(191) NOT NULL,
    `status` ENUM('PENDING', 'ACCEPTED', 'DECLINED', 'REVOKED', 'EXPIRED') NOT NULL DEFAULT 'PENDING',
    `message` VARCHAR(191) NULL,
    `createdByUserId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `expiresAt` DATETIME(3) NULL,

    UNIQUE INDEX `TeamInvite_token_key`(`token`),
    INDEX `TeamInvite_eventId_idx`(`eventId`),
    INDEX `TeamInvite_teamId_idx`(`teamId`),
    INDEX `TeamInvite_email_idx`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TeamJoinRequest` (
    `id` VARCHAR(191) NOT NULL,
    `eventId` VARCHAR(191) NOT NULL,
    `teamId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `message` VARCHAR(191) NULL,
    `status` ENUM('PENDING', 'ACCEPTED', 'DECLINED', 'CANCELLED') NOT NULL DEFAULT 'PENDING',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `TeamJoinRequest_eventId_idx`(`eventId`),
    INDEX `TeamJoinRequest_teamId_idx`(`teamId`),
    INDEX `TeamJoinRequest_userId_idx`(`userId`),
    UNIQUE INDEX `TeamJoinRequest_teamId_userId_key`(`teamId`, `userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TeamAuditLog` (
    `id` VARCHAR(191) NOT NULL,
    `eventId` VARCHAR(191) NOT NULL,
    `teamId` VARCHAR(191) NOT NULL,
    `actorId` VARCHAR(191) NULL,
    `targetUserId` VARCHAR(191) NULL,
    `action` ENUM('TEAM_CREATED', 'TEAM_UPDATED', 'TEAM_DELETED', 'INVITE_SENT', 'INVITE_REVOKED', 'INVITE_ACCEPTED', 'INVITE_DECLINED', 'JOIN_REQUEST_SENT', 'JOIN_REQUEST_ACCEPTED', 'JOIN_REQUEST_DECLINED', 'JOIN_REQUEST_CANCELLED', 'MEMBER_LEFT', 'MEMBER_KICKED', 'LEADER_TRANSFERRED') NOT NULL,
    `meta` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `TeamAuditLog_eventId_idx`(`eventId`),
    INDEX `TeamAuditLog_teamId_idx`(`teamId`),
    INDEX `TeamAuditLog_actorId_idx`(`actorId`),
    INDEX `TeamAuditLog_targetUserId_idx`(`targetUserId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Submission` (
    `id` VARCHAR(191) NOT NULL,
    `eventId` VARCHAR(191) NOT NULL,
    `teamId` VARCHAR(191) NULL,
    `authorId` VARCHAR(191) NULL,
    `status` ENUM('DRAFT', 'SUBMITTED') NOT NULL DEFAULT 'DRAFT',
    `title` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `content` JSON NULL,
    `imageUrls` JSON NULL,
    `videoUrl` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `submittedAt` DATETIME(3) NULL,

    INDEX `Submission_eventId_idx`(`eventId`),
    INDEX `Submission_teamId_idx`(`teamId`),
    INDEX `Submission_authorId_idx`(`authorId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `JudgeAssignment` (
    `id` VARCHAR(191) NOT NULL,
    `eventId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `role` ENUM('JUDGE', 'ADMIN_JUDGE') NOT NULL DEFAULT 'JUDGE',

    INDEX `JudgeAssignment_userId_idx`(`userId`),
    INDEX `JudgeAssignment_eventId_idx`(`eventId`),
    UNIQUE INDEX `JudgeAssignment_eventId_userId_key`(`eventId`, `userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Score` (
    `id` VARCHAR(191) NOT NULL,
    `submissionId` VARCHAR(191) NOT NULL,
    `judgeId` VARCHAR(191) NOT NULL,
    `total` DOUBLE NULL,
    `breakdown` JSON NULL,
    `feedback` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Score_submissionId_idx`(`submissionId`),
    INDEX `Score_judgeId_idx`(`judgeId`),
    UNIQUE INDEX `Score_submissionId_judgeId_key`(`submissionId`, `judgeId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Announcement` (
    `id` VARCHAR(191) NOT NULL,
    `eventId` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `bodyRich` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `Announcement_eventId_idx`(`eventId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ContactMessage` (
    `id` VARCHAR(191) NOT NULL,
    `firstName` VARCHAR(191) NOT NULL,
    `lastName` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `phone` VARCHAR(191) NULL,
    `organization` VARCHAR(191) NULL,
    `message` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `readAt` DATETIME(3) NULL,

    INDEX `ContactMessage_email_idx`(`email`),
    INDEX `ContactMessage_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `OrgMembership` ADD CONSTRAINT `OrgMembership_orgId_fkey` FOREIGN KEY (`orgId`) REFERENCES `Organization`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `OrgMembership` ADD CONSTRAINT `OrgMembership_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Event` ADD CONSTRAINT `Event_orgId_fkey` FOREIGN KEY (`orgId`) REFERENCES `Organization`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `EventRegistrationRequest` ADD CONSTRAINT `EventRegistrationRequest_eventId_fkey` FOREIGN KEY (`eventId`) REFERENCES `Event`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `EventRegistrationRequest` ADD CONSTRAINT `EventRegistrationRequest_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `EventParticipant` ADD CONSTRAINT `EventParticipant_eventId_fkey` FOREIGN KEY (`eventId`) REFERENCES `Event`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `EventParticipant` ADD CONSTRAINT `EventParticipant_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SubmissionSchema` ADD CONSTRAINT `SubmissionSchema_eventId_fkey` FOREIGN KEY (`eventId`) REFERENCES `Event`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Team` ADD CONSTRAINT `Team_eventId_fkey` FOREIGN KEY (`eventId`) REFERENCES `Event`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TeamMember` ADD CONSTRAINT `TeamMember_teamId_fkey` FOREIGN KEY (`teamId`) REFERENCES `Team`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TeamMember` ADD CONSTRAINT `TeamMember_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TeamInvite` ADD CONSTRAINT `TeamInvite_eventId_fkey` FOREIGN KEY (`eventId`) REFERENCES `Event`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TeamInvite` ADD CONSTRAINT `TeamInvite_teamId_fkey` FOREIGN KEY (`teamId`) REFERENCES `Team`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TeamInvite` ADD CONSTRAINT `TeamInvite_createdByUserId_fkey` FOREIGN KEY (`createdByUserId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TeamJoinRequest` ADD CONSTRAINT `TeamJoinRequest_eventId_fkey` FOREIGN KEY (`eventId`) REFERENCES `Event`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TeamJoinRequest` ADD CONSTRAINT `TeamJoinRequest_teamId_fkey` FOREIGN KEY (`teamId`) REFERENCES `Team`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TeamJoinRequest` ADD CONSTRAINT `TeamJoinRequest_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TeamAuditLog` ADD CONSTRAINT `TeamAuditLog_eventId_fkey` FOREIGN KEY (`eventId`) REFERENCES `Event`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TeamAuditLog` ADD CONSTRAINT `TeamAuditLog_teamId_fkey` FOREIGN KEY (`teamId`) REFERENCES `Team`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TeamAuditLog` ADD CONSTRAINT `TeamAuditLog_actorId_fkey` FOREIGN KEY (`actorId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TeamAuditLog` ADD CONSTRAINT `TeamAuditLog_targetUserId_fkey` FOREIGN KEY (`targetUserId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Submission` ADD CONSTRAINT `Submission_eventId_fkey` FOREIGN KEY (`eventId`) REFERENCES `Event`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Submission` ADD CONSTRAINT `Submission_teamId_fkey` FOREIGN KEY (`teamId`) REFERENCES `Team`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Submission` ADD CONSTRAINT `Submission_authorId_fkey` FOREIGN KEY (`authorId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `JudgeAssignment` ADD CONSTRAINT `JudgeAssignment_eventId_fkey` FOREIGN KEY (`eventId`) REFERENCES `Event`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `JudgeAssignment` ADD CONSTRAINT `JudgeAssignment_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Score` ADD CONSTRAINT `Score_submissionId_fkey` FOREIGN KEY (`submissionId`) REFERENCES `Submission`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Score` ADD CONSTRAINT `Score_judgeId_fkey` FOREIGN KEY (`judgeId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Announcement` ADD CONSTRAINT `Announcement_eventId_fkey` FOREIGN KEY (`eventId`) REFERENCES `Event`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
