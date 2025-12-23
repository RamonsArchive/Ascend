require("dotenv").config();
const { PrismaClient } = require("@prisma/client");

(async () => {
  const p = new PrismaClient();
  try {
    const r = await p.organization.findFirst();
    console.log("PRISMA_OK", !!r);
  } catch (e) {
    console.error("PRISMA_FAIL", e);
    process.exitCode = 1;
  } finally {
    await p.$disconnect();
  }
})();
