const { PrismaClient } = require("@prisma/client");

const storageMode = (process.env.STORAGE_MODE || "json").toLowerCase();

const prisma = storageMode === "sqlite"
	? new PrismaClient()
	: new Proxy({}, {
			get() {
				throw new Error("Prisma is disabled when STORAGE_MODE is not sqlite");
			}
		});

module.exports = { prisma };
