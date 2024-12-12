import DnsExplorer from "@/app/components/dns-explorer";
import DomainTable from "@/app/components/domain-table";

export default function Home() {
  return (
    <>
      <DnsExplorer></DnsExplorer>
      <DomainTable></DomainTable>
    </>
  );
}
