import { type table_name } from "@/generated/prisma";
import axios from "axios";

export async function getAllTests(): Promise<table_name[]> {
  const res = await axios.get("/api/tests");
  return res.data;
}

export async function createTest(name: string): Promise<void> {
  await axios.post("/api/tests", {
    name,
  });
}

export async function deleteTest(id: number): Promise<void> {
  await axios.delete(`/api/tests?id=${id}`);
}
