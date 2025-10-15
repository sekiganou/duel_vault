import { CardTabItem } from "@/types";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Tabs, Tab } from "@heroui/tabs";
import { ScrollShadow } from "@heroui/scroll-shadow";

interface CustomTabsProps {
  tabs: CardTabItem[];
  className?: string;
}

export const CardTabs = ({ tabs, className }: CustomTabsProps) => {
  const EmptyContent = ({
    emptyContent,
  }: {
    emptyContent: CardTabItem["emptyContent"];
  }) => (
    <div className="flex flex-col items-center">
      <emptyContent.icon size={48} className="text-default-300 mx-auto mb-4" />
      <h3 className="text-lg font-semibold text-default-500 mb-2">
        {emptyContent.header}
      </h3>
      <p className="text-default-400">{emptyContent.text}</p>
    </div>
  );

  return (
    <Tabs
      placement="top"
      classNames={{
        base: `w-full mb-4 ${className || ""}`,
        tabList: "flex-col md:flex-row gap-2 md:gap-0 w-full md:w-auto ",
        tab: "w-full md:w-auto justify-start md:justify-center text-left md:text-center",
      }}
      items={tabs}
    >
      {tabs.map((tab) => (
        <Tab key={tab.key} title={tab.title}>
          <Card>
            <CardHeader>
              <h2 className="text-xl font-semibold">{tab.title}</h2>
            </CardHeader>
            <CardBody>
              {tab.emptyContent.displayEmptyContent ? (
                <EmptyContent emptyContent={tab.emptyContent} />
              ) : (
                <ScrollShadow className="max-h-[400px]">
                  {tab.cardBody}
                </ScrollShadow>
              )}
            </CardBody>
          </Card>
        </Tab>
      ))}
    </Tabs>
  );
};
