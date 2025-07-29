"use client";

import { Link } from "@heroui/link";
import { Snippet } from "@heroui/snippet";
import { Code } from "@heroui/code";
import { button as buttonStyles } from "@heroui/theme";

import { siteConfig } from "@/config/site";
import { title, subtitle } from "@/components/primitives";
import { GithubIcon } from "@/components/icons";
import { useEffect, useState } from "react";
import { table_name } from "@/generated/prisma";
import { Button } from "@heroui/button";
import { createTest, deleteTest, getAllTests } from "@/lib/api/tests";
import { IconTrash } from "@tabler/icons-react";

export default function Home() {
  const [tests, setTests] = useState<table_name[]>();
  const [counter, setCounter] = useState(0);

  useEffect(() => {
    getAllTests().then((tests) => {
      setTests(tests);
      setCounter(tests.length);
    });
  }, []);

  const handleCreate = async () => {
    await createTest("test_" + counter);
    const updated = await getAllTests();
    setTests(updated);
    setCounter(updated.length);
  };

  const handleDelete = async (id: number) => {
    await deleteTest(id);
    const updated = await getAllTests();
    setTests(updated);
    setCounter(updated.length);
  };

  return (
    <section className="flex flex-col items-center justify-center gap-4 py-8 md:py-10">
      <div className="inline-block max-w-xl text-center justify-center">
        <span className={title()}>Make&nbsp;</span>
        <span className={title({ color: "violet" })}>beautiful&nbsp;</span>
        <br />
        <span className={title()}>
          websites regardless of your design experience.
        </span>
        <div className={subtitle({ class: "mt-4" })}>
          Beautiful, fast and modern React UI library.
        </div>
      </div>

      <div className="flex gap-3">
        <Button
          className={buttonStyles({
            color: "primary",
            variant: "shadow",
          })}
          onPress={handleCreate}
        >
          Create test
        </Button>
      </div>

      <div className="mt-8">
        <Snippet hideCopyButton hideSymbol variant="bordered">
          <span>
            Get started by editing <Code color="primary">app/page.tsx</Code>
          </span>
        </Snippet>
        <div className="flex flex-col mt-4">
          {tests &&
            tests.map((test) => (
              <div className="flex gap-2 my-1 w-full" key={test.id}>
                <Snippet
                  hideCopyButton
                  hideSymbol
                  variant="bordered"
                  className="w-full"
                >
                  {test.name}
                </Snippet>
                <Button
                  isIconOnly
                  size="sm"
                  variant="solid"
                  onPress={() => handleDelete(test.id)}
                >
                  <IconTrash />
                </Button>
              </div>
            ))}
        </div>
      </div>
    </section>
  );
}
