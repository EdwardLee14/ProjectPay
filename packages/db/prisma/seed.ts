/**
 * Demo seed: Supabase Auth users + Prisma data for VisiBill-style testing.
 *
 * Requires: DATABASE_URL, NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 * Optional: SEED_AUTH_PASSWORD (default VisiBillDemo2026!), SEED_RESET=1 to remove prior seed users' rows first
 *
 * Run from repo root: pnpm db:seed
 */

import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import {
  PrismaClient,
  Prisma,
  Role,
  ProjectStatus,
  ChangeOrderStatus,
  TopUpRequestStatus,
  AlertType,
} from "@prisma/client";

const cwd = process.cwd();
config({ path: path.join(cwd, "..", "..", "apps", ".env") });
config({ path: path.join(cwd, "..", "..", ".env") });
config({ path: path.join(cwd, ".env") });

const prisma = new PrismaClient();

const SEED_AUTH_PASSWORD =
  process.env.SEED_AUTH_PASSWORD ?? "VisiBillDemo2026!";

const SEED_EMAILS = [
  "visibilltestclient@gmail.com",
  "visibilltestcontractor@gmail.com",
  "visibillseed.client.harper@gmail.com",
  "visibillseed.client.jordan@gmail.com",
  "visibillseed.contractor.alex@gmail.com",
  "visibillseed.contractor.riley@gmail.com",
] as const;

type SeedEmail = (typeof SEED_EMAILS)[number];

const USER_SPECS: Record<
  SeedEmail,
  { name: string; role: Role; companyName?: string; phone?: string }
> = {
  "visibilltestclient@gmail.com": {
    name: "Priya Shah",
    role: Role.CLIENT,
    companyName: "Shah Family Trust",
    phone: "+1 415-555-0142",
  },
  "visibilltestcontractor@gmail.com": {
    name: "Marcus Webb",
    role: Role.CONTRACTOR,
    companyName: "Webb Build Co.",
    phone: "+1 510-555-0198",
  },
  "visibillseed.client.harper@gmail.com": {
    name: "Harper Nguyen",
    role: Role.CLIENT,
    companyName: "Nguyen Residence",
  },
  "visibillseed.client.jordan@gmail.com": {
    name: "Jordan Patel",
    role: Role.CLIENT,
    companyName: "Patel Holdings LLC",
  },
  "visibillseed.contractor.alex@gmail.com": {
    name: "Alex Morales",
    role: Role.CONTRACTOR,
    companyName: "Morales Electric",
  },
  "visibillseed.contractor.riley@gmail.com": {
    name: "Riley Chen",
    role: Role.CONTRACTOR,
    companyName: "Chen Tile & Stone",
  },
};

let stripeTxnSeq = 0;
function stripeId(prefix: string) {
  stripeTxnSeq += 1;
  return `seed_${prefix}_${Date.now()}_${stripeTxnSeq}`;
}

async function getOrCreateAuthUser(
  supabaseUrl: string,
  serviceRole: string,
  email: string
): Promise<string> {
  const admin = createClient(supabaseUrl, serviceRole, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: created, error: createErr } =
    await admin.auth.admin.createUser({
      email,
      password: SEED_AUTH_PASSWORD,
      email_confirm: true,
    });

  if (created.user) return created.user.id;

  const msg = createErr?.message ?? "";
  if (!/already|registered|exists|duplicate/i.test(msg)) {
    throw new Error(`Supabase createUser ${email}: ${createErr?.message}`);
  }

  let page = 1;
  for (;;) {
    const { data, error } = await admin.auth.admin.listUsers({
      page,
      perPage: 200,
    });
    if (error) throw error;
    const found = data.users.find(
      (u) => u.email?.toLowerCase() === email.toLowerCase()
    );
    if (found) return found.id;
    if (data.users.length < 200) break;
    page += 1;
  }
  throw new Error(`Supabase user exists but not found in list: ${email}`);
}

async function wipeSeedUsers() {
  const users = await prisma.user.findMany({
    where: { email: { in: [...SEED_EMAILS] } },
    select: { id: true },
  });
  const ids = users.map((u) => u.id);
  if (ids.length === 0) return;

  await prisma.project.deleteMany({
    where: {
      OR: [{ contractorId: { in: ids } }, { clientId: { in: ids } }],
    },
  });
  await prisma.user.deleteMany({ where: { id: { in: ids } } });
  console.log("Removed prior seed users and their projects.");
}

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!databaseUrl) throw new Error("DATABASE_URL is not set");
  if (!supabaseUrl) throw new Error("NEXT_PUBLIC_SUPABASE_URL is not set");
  if (!serviceRole) throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set");

  const reset = process.env.SEED_RESET === "1" || process.env.SEED_RESET === "true";
  if (reset) {
    await wipeSeedUsers();
  } else {
    const existing = await prisma.user.findUnique({
      where: { email: "visibilltestcontractor@gmail.com" },
      include: { _count: { select: { contractorProjects: true } } },
    });
    if (existing && existing._count.contractorProjects > 0) {
      console.log(
        "Seed data already present for visibilltestcontractor@gmail.com. Set SEED_RESET=1 to replace."
      );
      return;
    }
  }

  const supabaseIds: Record<SeedEmail, string> = {} as Record<
    SeedEmail,
    string
  >;
  for (const email of SEED_EMAILS) {
    supabaseIds[email] = await getOrCreateAuthUser(
      supabaseUrl,
      serviceRole,
      email
    );
  }

  const u = (email: SeedEmail) => supabaseIds[email];

  const priya = await prisma.user.upsert({
    where: { email: "visibilltestclient@gmail.com" },
    create: {
      supabaseId: u("visibilltestclient@gmail.com"),
      ...USER_SPECS["visibilltestclient@gmail.com"],
      email: "visibilltestclient@gmail.com",
    },
    update: {
      supabaseId: u("visibilltestclient@gmail.com"),
      ...USER_SPECS["visibilltestclient@gmail.com"],
    },
  });

  const marcus = await prisma.user.upsert({
    where: { email: "visibilltestcontractor@gmail.com" },
    create: {
      supabaseId: u("visibilltestcontractor@gmail.com"),
      ...USER_SPECS["visibilltestcontractor@gmail.com"],
      email: "visibilltestcontractor@gmail.com",
    },
    update: {
      supabaseId: u("visibilltestcontractor@gmail.com"),
      ...USER_SPECS["visibilltestcontractor@gmail.com"],
    },
  });

  const harper = await prisma.user.upsert({
    where: { email: "visibillseed.client.harper@gmail.com" },
    create: {
      supabaseId: u("visibillseed.client.harper@gmail.com"),
      ...USER_SPECS["visibillseed.client.harper@gmail.com"],
      email: "visibillseed.client.harper@gmail.com",
    },
    update: {
      supabaseId: u("visibillseed.client.harper@gmail.com"),
      ...USER_SPECS["visibillseed.client.harper@gmail.com"],
    },
  });

  const jordan = await prisma.user.upsert({
    where: { email: "visibillseed.client.jordan@gmail.com" },
    create: {
      supabaseId: u("visibillseed.client.jordan@gmail.com"),
      ...USER_SPECS["visibillseed.client.jordan@gmail.com"],
      email: "visibillseed.client.jordan@gmail.com",
    },
    update: {
      supabaseId: u("visibillseed.client.jordan@gmail.com"),
      ...USER_SPECS["visibillseed.client.jordan@gmail.com"],
    },
  });

  const alex = await prisma.user.upsert({
    where: { email: "visibillseed.contractor.alex@gmail.com" },
    create: {
      supabaseId: u("visibillseed.contractor.alex@gmail.com"),
      ...USER_SPECS["visibillseed.contractor.alex@gmail.com"],
      email: "visibillseed.contractor.alex@gmail.com",
    },
    update: {
      supabaseId: u("visibillseed.contractor.alex@gmail.com"),
      ...USER_SPECS["visibillseed.contractor.alex@gmail.com"],
    },
  });

  const riley = await prisma.user.upsert({
    where: { email: "visibillseed.contractor.riley@gmail.com" },
    create: {
      supabaseId: u("visibillseed.contractor.riley@gmail.com"),
      ...USER_SPECS["visibillseed.contractor.riley@gmail.com"],
      email: "visibillseed.contractor.riley@gmail.com",
    },
    update: {
      supabaseId: u("visibillseed.contractor.riley@gmail.com"),
      ...USER_SPECS["visibillseed.contractor.riley@gmail.com"],
    },
  });

  type Cat = { name: string; allocated: string; spent: string; mcc: string[] };

  async function seedProject(opts: {
    name: string;
    description: string;
    status: ProjectStatus;
    contractorId: string;
    clientId: string;
    clientEmail: string;
    totalBudget: string;
    fundedAmount: string;
    counterBudget?: string;
    categories: Cat[];
    merchants: { name: string; amount: string; catIdx: number; mcc: string }[];
    messages: { senderId: string; body: string; daysAgo: number }[];
    changeOrders?: {
      requestedBy: string;
      amount: string;
      reason: string;
      status: ChangeOrderStatus;
      catIdx?: number;
    }[];
    topUps?: {
      requestedBy: string;
      amount: string;
      reason: string;
      status: TopUpRequestStatus;
      catIdx: number;
    }[];
    alerts?: {
      type: AlertType;
      catIdx?: number;
    }[];
  }) {
    const project = await prisma.project.create({
      data: {
        name: opts.name,
        description: opts.description,
        status: opts.status,
        contractorId: opts.contractorId,
        clientId: opts.clientId,
        clientEmail: opts.clientEmail,
        totalBudget: new Prisma.Decimal(opts.totalBudget),
        fundedAmount: new Prisma.Decimal(opts.fundedAmount),
        counterBudget:
          opts.counterBudget !== undefined
            ? new Prisma.Decimal(opts.counterBudget)
            : undefined,
      },
    });

    const cats = await Promise.all(
      opts.categories.map((c) =>
        prisma.budgetCategory.create({
          data: {
            projectId: project.id,
            name: c.name,
            allocatedAmount: new Prisma.Decimal(c.allocated),
            spentAmount: new Prisma.Decimal(c.spent),
            merchantCategoryCodes: c.mcc,
          },
        })
      )
    );

    const now = Date.now();
    for (const m of opts.merchants) {
      const cat = cats[m.catIdx];
      await prisma.transaction.create({
        data: {
          projectId: project.id,
          budgetCategoryId: cat.id,
          merchantName: m.name,
          amount: new Prisma.Decimal(m.amount),
          categoryCode: m.mcc,
          stripeTransactionId: stripeId("txn"),
        },
      });
    }

    for (const msg of opts.messages) {
      await prisma.projectMessage.create({
        data: {
          projectId: project.id,
          senderId: msg.senderId,
          body: msg.body,
          createdAt: new Date(now - msg.daysAgo * 86400000),
        },
      });
    }

    if (opts.changeOrders) {
      for (const co of opts.changeOrders) {
        await prisma.changeOrder.create({
          data: {
            projectId: project.id,
            budgetCategoryId:
              co.catIdx !== undefined ? cats[co.catIdx].id : null,
            requestedBy: co.requestedBy,
            amount: new Prisma.Decimal(co.amount),
            reason: co.reason,
            status: co.status,
            resolvedAt:
              co.status === ChangeOrderStatus.PENDING ? null : new Date(),
          },
        });
      }
    }

    if (opts.topUps) {
      for (const tu of opts.topUps) {
        await prisma.topUpRequest.create({
          data: {
            projectId: project.id,
            budgetCategoryId: cats[tu.catIdx].id,
            requestedAmount: new Prisma.Decimal(tu.amount),
            reason: tu.reason,
            status: tu.status,
            requestedBy: tu.requestedBy,
            resolvedAt:
              tu.status === TopUpRequestStatus.PENDING ? null : new Date(),
          },
        });
      }
    }

    if (opts.alerts) {
      for (const a of opts.alerts) {
        await prisma.budgetAlert.create({
          data: {
            projectId: project.id,
            budgetCategoryId:
              a.catIdx !== undefined ? cats[a.catIdx].id : null,
            alertType: a.type,
          },
        });
      }
    }

    return project;
  }

  const materials: Cat = {
    name: "Materials",
    allocated: "45000",
    spent: "31200",
    mcc: ["5039", "5211"],
  };
  const labor: Cat = {
    name: "Labor",
    allocated: "60000",
    spent: "52800",
    mcc: ["1520"],
  };
  const fixtures: Cat = {
    name: "Fixtures",
    allocated: "12000",
    spent: "8900",
    mcc: ["5712"],
  };

  await seedProject({
    name: "Noe Valley kitchen & bath",
    description: "Full remodel with structural beam work and new casework.",
    status: ProjectStatus.ACTIVE,
    contractorId: marcus.id,
    clientId: priya.id,
    clientEmail: priya.email,
    totalBudget: "125000",
    fundedAmount: "118000",
    categories: [
      { ...materials, spent: "31200" },
      { ...labor, spent: "52800" },
      { ...fixtures, spent: "8900" },
    ],
    merchants: [
      { name: "Pacific Lumber Supply", amount: "4200.15", catIdx: 0, mcc: "5039" },
      { name: "Kitchen & Bath Gallery", amount: "6125.00", catIdx: 2, mcc: "5712" },
      { name: "Payroll — framing crew", amount: "8400.00", catIdx: 1, mcc: "1520" },
      { name: "Home Depot", amount: "883.44", catIdx: 0, mcc: "5211" },
    ],
    messages: [
      {
        senderId: marcus.id,
        body: "Beam spec is approved by the PE — we can pour the pad next week.",
        daysAgo: 5,
      },
      {
        senderId: priya.id,
        body: "Great. Please send photos after rough electrical before we close drywall.",
        daysAgo: 4,
      },
      {
        senderId: marcus.id,
        body: "Will do. Also flagged one line item for tile freight — see change order.",
        daysAgo: 3,
      },
      {
        senderId: priya.id,
        body: "Approved the freight CO. Thanks for the heads-up.",
        daysAgo: 2,
      },
    ],
    changeOrders: [
      {
        requestedBy: marcus.id,
        amount: "1850",
        reason: "Overweight tile pallet — liftgate delivery surcharge",
        status: ChangeOrderStatus.APPROVED,
        catIdx: 2,
      },
      {
        requestedBy: marcus.id,
        amount: "4200",
        reason: "Additional recessed lighting in great room",
        status: ChangeOrderStatus.PENDING,
        catIdx: 1,
      },
    ],
    topUps: [
      {
        requestedBy: marcus.id,
        amount: "3500",
        reason: "Countertop slab upgrade to quartzite",
        status: TopUpRequestStatus.PENDING,
        catIdx: 2,
      },
    ],
    alerts: [{ type: AlertType.CATEGORY_90_PCT, catIdx: 1 }],
  });

  await seedProject({
    name: "Bernal ADU — Phase 2",
    description: "Finish-out, appliances, and landscape tie-in.",
    status: ProjectStatus.COMPLETE,
    contractorId: marcus.id,
    clientId: priya.id,
    clientEmail: priya.email,
    totalBudget: "88000",
    fundedAmount: "88000",
    categories: [
      { name: "Materials", allocated: "28000", spent: "27550", mcc: ["5039"] },
      { name: "Labor", allocated: "52000", spent: "51800", mcc: ["1520"] },
      { name: "Fees & permits", allocated: "8000", spent: "7650", mcc: ["9399"] },
    ],
    merchants: [
      { name: "Ferguson Plumbing", amount: "2140.88", catIdx: 0, mcc: "5039" },
      { name: "Final labor draw", amount: "12000.00", catIdx: 1, mcc: "1520" },
      { name: "SF DBI permit closeout", amount: "450.00", catIdx: 2, mcc: "9399" },
    ],
    messages: [
      {
        senderId: priya.id,
        body: "Walkthrough looked excellent. Please upload the lien releases when you have them.",
        daysAgo: 18,
      },
      {
        senderId: marcus.id,
        body: "Uploaded to the project folder — all subs signed off.",
        daysAgo: 17,
      },
    ],
  });

  await seedProject({
    name: "Castro facade refresh",
    description: "Stucco repair, windows, and paint.",
    status: ProjectStatus.PENDING_APPROVAL,
    contractorId: marcus.id,
    clientId: priya.id,
    clientEmail: priya.email,
    totalBudget: "42000",
    fundedAmount: "0",
    categories: [
      { name: "Exterior", allocated: "22000", spent: "0", mcc: ["1740"] },
      { name: "Windows", allocated: "15000", spent: "0", mcc: ["5039"] },
      { name: "Paint", allocated: "5000", spent: "0", mcc: ["5198"] },
    ],
    merchants: [],
    messages: [
      {
        senderId: marcus.id,
        body: "Proposal attached — waiting on your approval to issue the card.",
        daysAgo: 1,
      },
    ],
  });

  await seedProject({
    name: "Potrero master suite",
    description: "Bathroom gut, new steam shower, radiant heat.",
    status: ProjectStatus.COUNTER_PROPOSED,
    contractorId: marcus.id,
    clientId: priya.id,
    clientEmail: priya.email,
    totalBudget: "95000",
    fundedAmount: "20000",
    counterBudget: "88000",
    categories: [
      { name: "Rough plumbing & heat", allocated: "28000", spent: "1200", mcc: ["5074"] },
      { name: "Tile & stone", allocated: "22000", spent: "0", mcc: ["5712"] },
      { name: "GC labor", allocated: "45000", spent: "0", mcc: ["1520"] },
    ],
    merchants: [
      { name: "Supplyhouse.com — valves", amount: "1200.00", catIdx: 0, mcc: "5074" },
    ],
    messages: [
      {
        senderId: priya.id,
        body: "Love the direction — can we trim the tile allowance to stay closer to original scope?",
        daysAgo: 2,
      },
      {
        senderId: marcus.id,
        body: "Counter-proposed budget uploaded. Steam unit stays; we reduced stone SF.",
        daysAgo: 1,
      },
    ],
  });

  await seedProject({
    name: "Hayes Valley lighting retrofit",
    description: "Panel upgrade, LED throughout, Lutron system.",
    status: ProjectStatus.ACTIVE,
    contractorId: alex.id,
    clientId: priya.id,
    clientEmail: priya.email,
    totalBudget: "34000",
    fundedAmount: "30000",
    categories: [
      { name: "Electrical materials", allocated: "14000", spent: "9800", mcc: ["5065"] },
      { name: "Labor", allocated: "18000", spent: "11200", mcc: ["1520"] },
      { name: "Controls & commissioning", allocated: "2000", spent: "400", mcc: ["5732"] },
    ],
    merchants: [
      { name: "Graybar Electric", amount: "2450.00", catIdx: 0, mcc: "5065" },
      { name: "Crew week 3", amount: "4800.00", catIdx: 1, mcc: "1520" },
    ],
    messages: [
      {
        senderId: alex.id,
        body: "Lutron hub is on order — ETA Friday. Rough-in photos in drive.",
        daysAgo: 6,
      },
      {
        senderId: priya.id,
        body: "Perfect. Loop Marcus in if the drywall patch scope changes.",
        daysAgo: 5,
      },
      {
        senderId: marcus.id,
        body: "Noted — I'll coordinate skim coat with your trim day.",
        daysAgo: 4,
      },
    ],
    changeOrders: [
      {
        requestedBy: alex.id,
        amount: "950",
        reason: "AFCI breaker kit — code update mid-job",
        status: ChangeOrderStatus.APPROVED,
        catIdx: 0,
      },
    ],
  });

  await seedProject({
    name: "Sunset bungalow — bath tile",
    description: "Hall bath floor and shower waterproofing.",
    status: ProjectStatus.COMPLETE,
    contractorId: riley.id,
    clientId: harper.id,
    clientEmail: harper.email,
    totalBudget: "24000",
    fundedAmount: "24000",
    categories: [
      { name: "Tile & materials", allocated: "12000", spent: "11950", mcc: ["5712"] },
      { name: "Setting labor", allocated: "10000", spent: "9950", mcc: ["1520"] },
      { name: "Waterproofing", allocated: "2000", spent: "2100", mcc: ["5039"] },
    ],
    merchants: [
      { name: "TileBar", amount: "3200.00", catIdx: 0, mcc: "5712" },
      { name: "Schluter supply", amount: "890.12", catIdx: 2, mcc: "5039" },
    ],
    messages: [
      {
        senderId: riley.id,
        body: "Flood test passed — green light for mud set Monday.",
        daysAgo: 40,
      },
      {
        senderId: harper.id,
        body: "Looks amazing. Thanks for the daily pics.",
        daysAgo: 39,
      },
    ],
  });

  await seedProject({
    name: "Mission spec suite — flooring",
    description: "Engineered oak + sound mat in two units.",
    status: ProjectStatus.PENDING_FUNDING,
    contractorId: marcus.id,
    clientId: jordan.id,
    clientEmail: jordan.email,
    totalBudget: "56000",
    fundedAmount: "0",
    categories: [
      { name: "Flooring product", allocated: "32000", spent: "0", mcc: ["5713"] },
      { name: "Install labor", allocated: "20000", spent: "0", mcc: ["1520"] },
      { name: "Prep & demo", allocated: "4000", spent: "0", mcc: ["1799"] },
    ],
    merchants: [],
    messages: [
      {
        senderId: marcus.id,
        body: "Jordan — budget is locked. Awaiting funding before we release subs.",
        daysAgo: 3,
      },
      {
        senderId: jordan.id,
        body: "Wire details sent to accounting. Should clear in 48h.",
        daysAgo: 2,
      },
    ],
  });

  await seedProject({
    name: "Richmond kitchen refresh (2023)",
    description: "Cabinet reface, counters, backsplash.",
    status: ProjectStatus.COMPLETE,
    contractorId: marcus.id,
    clientId: harper.id,
    clientEmail: harper.email,
    totalBudget: "48000",
    fundedAmount: "48000",
    categories: [
      { name: "Cabinetry", allocated: "22000", spent: "21800", mcc: ["5712"] },
      { name: "Counters", allocated: "14000", spent: "13950", mcc: ["5712"] },
      { name: "Labor", allocated: "12000", spent: "11800", mcc: ["1520"] },
    ],
    merchants: [
      { name: "Stone fabricator deposit", amount: "3500.00", catIdx: 1, mcc: "5712" },
    ],
    messages: [
      {
        senderId: harper.id,
        body: "Marcus, thanks again — we'll call you for the garage project next spring.",
        daysAgo: 400,
      },
      {
        senderId: marcus.id,
        body: "Anytime. I'll save a slot on the calendar.",
        daysAgo: 399,
      },
    ],
  });

  await seedProject({
    name: "Dogpatch office TI — spark",
    description: "Temporary power and lighting for tenant improvement.",
    status: ProjectStatus.CANCELLED,
    contractorId: alex.id,
    clientId: jordan.id,
    clientEmail: jordan.email,
    totalBudget: "18000",
    fundedAmount: "4000",
    categories: [
      { name: "Temp power", allocated: "8000", spent: "2100", mcc: ["5065"] },
      { name: "Labor", allocated: "10000", spent: "1900", mcc: ["1520"] },
    ],
    merchants: [
      { name: "Sunbelt Rentals", amount: "900.00", catIdx: 0, mcc: "5065" },
    ],
    messages: [
      {
        senderId: jordan.id,
        body: "Tenant pulled out — please pause all spend.",
        daysAgo: 60,
      },
      {
        senderId: alex.id,
        body: "Understood. Final invoice for mobilization only.",
        daysAgo: 59,
      },
    ],
  });

  console.log(`
Seed complete.

Sign-in (all seed accounts use the same password unless SEED_AUTH_PASSWORD was set):
  Password: ${SEED_AUTH_PASSWORD}

Primary demo:
  Client:     visibilltestclient@gmail.com
  Contractor: visibilltestcontractor@gmail.com

Background accounts (same password):
  ${SEED_EMAILS.filter((e) => !e.startsWith("visibilltest")).join("\n  ")}

Re-run: SEED_RESET=1 pnpm db:seed
`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
