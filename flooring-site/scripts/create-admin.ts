import "dotenv/config";
import { prisma } from "@/lib/db";
import { hashPassword } from "@/server/password";

function parseArgs(argv: string[]): { login: string; password: string } {
  const login = argv.find((a) => a.startsWith("--login="))?.slice("--login=".length);
  const password = argv.find((a) => a.startsWith("--password="))?.slice("--password=".length);
  if (!login || !password) {
    throw new Error("Usage: npm run create-admin -- --login=<login> --password=<password>");
  }
  return { login, password };
}

async function main() {
  const { login, password } = parseArgs(process.argv.slice(2));
  const passwordHash = await hashPassword(password);

  const user = await prisma.adminUser.upsert({
    where: { login },
    create: { login, passwordHash },
    update: { passwordHash },
  });

  console.log(`Admin user ready: ${user.login} (id: ${user.id})`);
}

main()
  .catch((error) => {
    console.error("Failed to create admin user:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
