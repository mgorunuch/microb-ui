'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { ForceGraph2D } from 'react-force-graph';
import { Menu } from '@headlessui/react';
import { ChevronDown, Loader2 } from 'lucide-react';

const DnsExplorer = () => {
  const [selectedDomain, setSelectedDomain] = useState('');
  const [graphData, setGraphData] = useState({ nodes: [], links: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Get unique domains from the graph data
  const domains = graphData.nodes
    .filter(node => node.label === 'DnsName')
    .map(node => node.name || node.id);

  const fetchGraphData = useCallback(async (domain?: string) => {
    try {
      setLoading(true);
      setError('');

      const url = new URL('/api/graph', window.location.origin);
      if (domain) {
        url.searchParams.set('domain', domain);
      }

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch graph data');
      }

      const data = await response.json();
      setGraphData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGraphData();
  }, [fetchGraphData]);

  const handleDomainSelect = useCallback((domain: string) => {
    setSelectedDomain(domain);
    fetchGraphData(domain);
  }, [fetchGraphData]);

  const nodeColor = useCallback(node => {
    switch (node.label) {
      case 'DnsName':
        return '#3b82f6';
      case 'Command':
        return '#ef4444';
      case 'CommandRun':
        return '#10b981';
      default:
        return '#6b7280';
    }
  }, []);

  if (error) {
    return (
      <div className="min-h-screen bg-base-200 p-4 flex items-center justify-center">
        <div className="alert alert-error">
          <span>{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base-200 p-4">
      <div className="container mx-auto">
        <div className="bg-base-100 rounded-lg shadow-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">DNS and Command Explorer</h2>

            <Menu as="div" className="relative">
              <Menu.Button className="btn btn-primary" disabled={loading}>
                {selectedDomain || 'Select Domain'}
                <ChevronDown className="ml-2 h-4 w-4" />
              </Menu.Button>

              <Menu.Items className="absolute right-0 mt-2 w-56 bg-base-100 rounded-lg shadow-lg z-10">
                <div className="p-1">
                  <Menu.Item>
                    {({ active }) => (
                      <button
                        className={`${
                          active ? 'bg-primary text-primary-content' : ''
                        } w-full text-left px-4 py-2 rounded-md`}
                        onClick={() => handleDomainSelect('')}
                      >
                        Show All
                      </button>
                    )}
                  </Menu.Item>

                  {domains.map(domain => (
                    <Menu.Item key={domain}>
                      {({ active }) => (
                        <button
                          className={`${
                            active ? 'bg-primary text-primary-content' : ''
                          } w-full text-left px-4 py-2 rounded-md`}
                          onClick={() => handleDomainSelect(domain)}
                        >
                          {domain}
                        </button>
                      )}
                    </Menu.Item>
                  ))}
                </div>
              </Menu.Items>
            </Menu>
          </div>

          <div className="h-[600px] border rounded-lg overflow-hidden relative">
            {loading ? (
              <div className="absolute inset-0 flex items-center justify-center bg-base-200/50">
                <Loader2 className="w-8 h-8 animate-spin" />
              </div>
            ) : (
              <ForceGraph2D
                graphData={graphData}
                nodeColor={nodeColor}
                nodeLabel={node => `${node.label}: ${node.name || node.id}`}
                linkDirectionalArrowLength={6}
                linkDirectionalArrowRelPos={1}
                nodeCanvasObject={(node, ctx, globalScale) => {
                  const label = node.name || node.id;
                  const fontSize = 12/globalScale;
                  ctx.font = `${fontSize}px Sans-Serif`;
                  ctx.fillStyle = nodeColor(node);
                  ctx.beginPath();
                  ctx.arc(node.x, node.y, 5, 0, 2 * Math.PI);
                  ctx.fill();
                  ctx.fillStyle = 'white';
                  ctx.textAlign = 'center';
                  ctx.textBaseline = 'middle';
                  ctx.fillText(label, node.x, node.y + 15);
                }}
              />
            )}
          </div>

          {selectedDomain && !loading && (
            <div className="mt-6">
              <h3 className="text-xl font-semibold mb-4">Connected CommandRuns</h3>
              <div className="overflow-x-auto">
                <table className="table w-full">
                  <thead>
                  <tr>
                    <th>CommandRun Key</th>
                    <th>Connected Commands</th>
                    <th>Connected Domains</th>
                  </tr>
                  </thead>
                  <tbody>
                  {graphData.nodes
                    .filter(node => node.label === 'CommandRun')
                    .map(cmdRun => {
                      const connectedNodes = graphData.links
                        .filter(link =>
                          link.source === cmdRun.id ||
                          link.target === cmdRun.id
                        )
                        .map(link =>
                          link.source === cmdRun.id ? link.target : link.source
                        );

                      const connectedCommands = connectedNodes
                        .filter(id =>
                          graphData.nodes.find(n =>
                            n.id === id && n.label === 'Command'
                          )
                        );

                      const connectedDomains = connectedNodes
                        .filter(id =>
                          graphData.nodes.find(n =>
                            n.id === id && n.label === 'DnsName'
                          )
                        );

                      return (
                        <tr key={cmdRun.id}>
                          <td>{cmdRun.key}</td>
                          <td>{connectedCommands.join(', ')}</td>
                          <td>{connectedDomains.join(', ')}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DnsExplorer;
