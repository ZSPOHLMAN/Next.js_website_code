'use client';

import React, { useCallback, useState } from 'react';
import ReactFlow, {
  Node,
  Edge,
  addEdge,
  Connection,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { createClient } from '@/lib/supabase/client';

const initialNodes: Node[] = [
  { id: '1', position: { x: 100, y: 100 }, data: { label: 'Start Point' } },
  { id: '2', position: { x: 300, y: 200 }, data: { label: 'Waypoint' } },
  { id: '3', position: { x: 500, y: 100 }, data: { label: 'End Point' } },
];

export default function DrawRoutePage() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [routeName, setRouteName] = useState('');
  const supabase = createClient();

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const saveRoute = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      alert('Please log in to save routes');
      return;
    }

    // Using schema-qualified table name
    const { data, error } = await supabase
      .from('app_routes.routes')
      .insert({
        user_id: user.id,
        route_name: routeName || 'Unnamed Route',
        route_data: { nodes, edges },
        stats: { created_at: new Date().toISOString() }
      });

    if (error) {
      console.error('Error saving route:', error);
      alert('Failed to save route');
    } else {
      alert('Route saved successfully!');
    }
  };

  const loadRoutes = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      alert('Please log in to view routes');
      return;
    }

    // Using schema-qualified table name for SELECT too
    const { data, error } = await supabase
      .from('app_routes.routes')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading routes:', error);
    } else {
      console.log('Loaded routes:', data);
      // Handle displaying saved routes here
    }
  };

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '10px', background: '#f0f0f0' }}>
        <input
          type="text"
          placeholder="Route name"
          value={routeName}
          onChange={(e) => setRouteName(e.target.value)}
          style={{ marginRight: '10px', padding: '5px' }}
        />
        <button onClick={saveRoute} style={{ marginRight: '10px', padding: '5px 10px' }}>
          Save Route
        </button>
        <button onClick={loadRoutes} style={{ padding: '5px 10px' }}>
          Load My Routes
        </button>
      </div>
      <div style={{ flex: 1 }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          fitView
        >
          <Background />
          <Controls />
        </ReactFlow>
      </div>
    </div>
  );
}