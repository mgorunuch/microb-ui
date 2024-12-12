// app/api/graph/route.ts
//import { Neo4jClient } from 'neo4j-driver';
import { NextResponse } from 'next/server';

// Initialize Neo4j driver
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
  const domain = searchParams.get('domain');

  const session = driver.session();

  try {
    let query = `
      MATCH (n)
      WHERE n:Command OR n:DnsName OR n:Hostname OR n:RecordType
      WITH n
      MATCH (n)-[r]-(m)
      WHERE m:Command OR m:DnsName OR m:Hostname OR m:RecordType OR m:CommandRun
    `;

    if (domain) {
      query += `
        WITH n, r, m
        WHERE n.name = $domain OR m.name = $domain
      `;
    }

    query += ` RETURN n, r, m LIMIT 10000`;

    const result = await session.run(query, { domain });

    // Transform Neo4j results into graph format
    const nodes = new Map();
    const links = new Set();

    result.records.forEach(record => {
      const n = record.get('n');
      const m = record.get('m');
      const r = record.get('r');

      // Add nodes
      nodes.set(n.identity.toString(), {
        id: n.identity.toString(),
        label: n.labels[0],
        ...n.properties
      });

      nodes.set(m.identity.toString(), {
        id: m.identity.toString(),
        label: m.labels[0],
        ...m.properties
      });

      // Add links
      links.add({
        source: n.identity.toString(),
        target: m.identity.toString(),
        type: r.type
      });
    });

    return NextResponse.json({
      nodes: Array.from(nodes.values()),
      links: Array.from(links)
    });

  } catch (error) {
    console.error('Neo4j Query Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch graph data' },
      { status: 500 }
    );
  } finally {
    await session.close();
  }
}
