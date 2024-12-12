// app/api/domains/route.ts
import { NextResponse } from 'next/server';
import neo4j from 'neo4j-driver';

const driver = neo4j.driver(
  process.env.NEO4J_URI || 'bolt://localhost:7687',
  neo4j.auth.basic(
    process.env.NEO4J_USER || 'neo4j',
    process.env.NEO4J_PASSWORD || 'password'
  )
);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const searchTerm = searchParams.get('search');

  const session = driver.session();

  try {
    let query = `
      MATCH (d:DnsName)
      WITH d
      OPTIONAL MATCH (d)-[r]-(related)
      WHERE related:DnsName OR related:Hostname OR related:RecordType OR related:CommandRun
      WITH d, 
           collect(DISTINCT related) as relatedNodes,
           collect(DISTINCT type(r)) as relationTypes
      RETURN 
        d.name as domain,
        [x IN relatedNodes WHERE x:DnsName | x.name] as relatedDomains,
        [x IN relatedNodes WHERE x:Hostname | x.name] as relatedHostnames,
        [x IN relatedNodes WHERE x:RecordType | x.name] as recordTypes,
        [x IN relatedNodes WHERE x:CommandRun | x.key] as commandRuns,
        size([x IN relatedNodes WHERE x:CommandRun]) as commandCount
    `;

    if (searchTerm) {
      query = `
        MATCH (d:DnsName)
        WHERE d.name CONTAINS $searchTerm
        WITH d
        OPTIONAL MATCH (d)-[r]-(related)
        WHERE related:DnsName OR related:Hostname OR related:RecordType OR related:CommandRun
        WITH d, 
             collect(DISTINCT related) as relatedNodes,
             collect(DISTINCT type(r)) as relationTypes
        RETURN 
          d.name as domain,
          [x IN relatedNodes WHERE x:DnsName | x.name] as relatedDomains,
          [x IN relatedNodes WHERE x:Hostname | x.name] as relatedHostnames,
          [x IN relatedNodes WHERE x:RecordType | x.name] as recordTypes,
          [x IN relatedNodes WHERE x:CommandRun | x.key] as commandRuns,
          size([x IN relatedNodes WHERE x:CommandRun]) as commandCount
      `;
    }

    const result = await session.run(query, { searchTerm });

    const domains = result.records.map(record => ({
      domain: record.get('domain'),
      relatedDomains: record.get('relatedDomains'),
      relatedHostnames: record.get('relatedHostnames'),
      recordTypes: record.get('recordTypes'),
      commandRuns: record.get('commandRuns'),
      commandCount: record.get('commandCount').low
    }));

    return NextResponse.json(domains);

  } catch (error) {
    console.error('Neo4j Query Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch domain data' },
      { status: 500 }
    );
  } finally {
    await session.close();
  }
}
