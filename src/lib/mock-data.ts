export type MembershipPlan = "Monthly" | "Quarterly" | "Half-Yearly" | "Yearly";

export type Member = {
  id: string;
  name: string;
  phone: string;
  age: number;
  gender: "Male" | "Female";
  address: string;
  emergencyContact: string;
  plan: MembershipPlan;
  joinDate: string; // ISO
  expiryDate: string; // ISO
  lastVisit: string; // ISO
  attendanceCount: number;
  amountPaid: number;
  remaining: number;
  fine: number;
  status: "Active" | "Inactive" | "Expiring";
  photo: string; // initials color seed
  notes?: string;
};

export const PLAN_PRICE: Record<MembershipPlan, number> = {
  Monthly: 3500,
  Quarterly: 9500,
  "Half-Yearly": 17000,
  Yearly: 30000,
};

const NAMES = [
  "Ahmed Raza", "Bilal Khan", "Sara Malik", "Hassan Ali", "Zara Sheikh",
  "Usman Tariq", "Ayesha Noor", "Faisal Iqbal", "Mehwish Fatima", "Kamran Shah",
  "Hina Zafar", "Adnan Yousuf", "Nida Aslam", "Rehan Butt", "Sana Javed",
  "Owais Qadir", "Fariha Hameed", "Junaid Akbar", "Rabia Karim", "Zeeshan Anwar",
  "Maria Saleem", "Tariq Mehmood", "Iqra Nadeem", "Salman Rauf", "Nimra Bashir",
  "Waqas Younis", "Anum Rasheed", "Imran Siddiqui", "Kiran Latif", "Fahad Aziz",
  "Sadia Perveen", "Umair Chaudhry", "Laiba Munir", "Yasir Shafiq", "Areeba Zafar",
  "Naveed Iqbal", "Sumaira Kanwal", "Danish Elahi", "Rida Naseer", "Hamza Farooq",
];

function seeded(i: number) {
  return (Math.sin(i * 9301 + 49297) * 233280) % 1;
}

function pick<T>(arr: T[], i: number): T {
  return arr[Math.abs(Math.floor(seeded(i) * arr.length)) % arr.length];
}

function daysAgo(d: number): string {
  const t = new Date();
  t.setDate(t.getDate() - d);
  return t.toISOString();
}

function daysAhead(d: number): string {
  const t = new Date();
  t.setDate(t.getDate() + d);
  return t.toISOString();
}

const PLANS: MembershipPlan[] = ["Monthly", "Quarterly", "Half-Yearly", "Yearly"];

export const MEMBERS: Member[] = NAMES.map((name, i) => {
  const plan = pick(PLANS, i + 1);
  const price = PLAN_PRICE[plan];
  const paidRatio = [1, 1, 1, 0.7, 0.5, 1, 0.3, 1][i % 8];
  const paid = Math.round(price * paidRatio);
  const remaining = price - paid;
  const joinedAgo = 5 + Math.floor(Math.abs(seeded(i + 2)) * 400);
  const lastVisitDays = i % 11 === 0 ? 95 : i % 7 === 0 ? 45 : i % 5 === 0 ? 20 : Math.floor(Math.abs(seeded(i + 3)) * 10);
  const expiryOffset = i % 6 === 0 ? -3 : i % 4 === 0 ? 5 : 20 + Math.floor(Math.abs(seeded(i + 4)) * 200);
  const status: Member["status"] =
    expiryOffset < 0 ? "Inactive" : expiryOffset <= 7 ? "Expiring" : lastVisitDays > 30 ? "Inactive" : "Active";
  const fine = lastVisitDays > 30 ? 200 : 0;
  return {
    id: `GYM-${(1000 + i).toString()}`,
    name,
    phone: `+92 3${(10 + (i % 40)).toString().padStart(2, "0")} ${(1000000 + i * 13337).toString().slice(0, 7)}`,
    age: 20 + (i % 25),
    gender: i % 3 === 0 ? "Female" : "Male",
    address: `${100 + i} Street ${1 + (i % 40)}, Block ${String.fromCharCode(65 + (i % 8))}, Lahore`,
    emergencyContact: `+92 30${i % 10} ${(2000000 + i * 7).toString().slice(0, 7)}`,
    plan,
    joinDate: daysAgo(joinedAgo),
    expiryDate: daysAhead(expiryOffset),
    lastVisit: daysAgo(lastVisitDays),
    attendanceCount: Math.max(0, 120 - lastVisitDays - (i % 40)),
    amountPaid: paid,
    remaining,
    fine,
    status,
    photo: `hsl(${(i * 47) % 360} 60% 55%)`,
    notes: i % 5 === 0 ? "Prefers evening sessions" : undefined,
  };
});

// Monthly revenue (current year)
export const MONTHLY_REVENUE = [
  { month: "Jan", revenue: 285000 },
  { month: "Feb", revenue: 312000 },
  { month: "Mar", revenue: 298500 },
  { month: "Apr", revenue: 341000 },
  { month: "May", revenue: 378000 },
  { month: "Jun", revenue: 402500 },
  { month: "Jul", revenue: 438000 },
  { month: "Aug", revenue: 415000 },
  { month: "Sep", revenue: 462000 },
  { month: "Oct", revenue: 489500 },
  { month: "Nov", revenue: 512000 },
  { month: "Dec", revenue: 547000 },
];

export const DAILY_SALES = Array.from({ length: 14 }, (_, i) => {
  const d = new Date();
  d.setDate(d.getDate() - (13 - i));
  const rev = 6000 + Math.floor(Math.abs(seeded(i + 20)) * 18000);
  return {
    date: d.toISOString(),
    revenue: rev,
    joined: (i % 5) + 1,
    method: i % 2 === 0 ? "Cash" : "Online",
  };
});

export function totalMembers() { return MEMBERS.length; }
export function activeMembers() { return MEMBERS.filter(m => m.status === "Active").length; }
export function inactiveMembers() { return MEMBERS.filter(m => m.status === "Inactive").length; }
export function expiringSoon() { return MEMBERS.filter(m => m.status === "Expiring").length; }
export function pendingDuesTotal() { return MEMBERS.reduce((s, m) => s + m.remaining, 0); }
export function pendingDuesCount() { return MEMBERS.filter(m => m.remaining > 0).length; }
export function todaysRevenue() { return DAILY_SALES[DAILY_SALES.length - 1].revenue; }
export function yesterdayRevenue() { return DAILY_SALES[DAILY_SALES.length - 2].revenue; }
export function monthlyRevenueTotal() { return MONTHLY_REVENUE.reduce((s, m) => s + m.revenue, 0); }
export function weeklyRevenue() { return DAILY_SALES.slice(-7).reduce((s, d) => s + d.revenue, 0); }

export function formatPKR(n: number) {
  return `PKR ${n.toLocaleString("en-PK")}`;
}

export function daysBetween(iso: string) {
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
}

export function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

export function initials(name: string) {
  return name.split(" ").map(p => p[0]).slice(0, 2).join("").toUpperCase();
}
