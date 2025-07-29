"use server";

import type { table_name } from "@/generated/prisma";
import { db } from "@/db";

export async function getAllTests(): Promise<table_name[]> {
  const tests = await db.table_name.findMany();
  return tests;
}
