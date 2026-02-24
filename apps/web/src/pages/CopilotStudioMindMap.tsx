import { type MouseEvent as ReactMouseEvent, useEffect, useMemo, useRef, useState } from 'react';

type MindMapNode = {
  id: string;
  label: string;
  children?: MindMapNode[];
};

type PositionedNode = {
  id: string;
  parentId: string | null;
  node: MindMapNode;
  depth: number;
  x: number;
  y: number;
};

type ConnectorPath = {
  id: string;
  d: string;
};

const ROOT_WIDTH = 250;
const NODE_WIDTH = 300;
const NODE_HEIGHT = 56;
const HORIZONTAL_GAP = 72;
const VERTICAL_GAP = 22;
const PADDING_X = 24;
const PADDING_Y = 24;
const MIN_ZOOM = 0.5;
const MAX_ZOOM = 2;
const ZOOM_STEP = 0.1;

const copilotStudioTree: MindMapNode = {
  id: 'copilot-studio',
  label: 'Copilot Studio',
  children: [
    {
      id: 'build-publish',
      label: 'Build & Publish',
      children: [
        {
          id: 'agent-authoring',
          label: 'Agent Authoring',
          children: [
            { id: 'visual-canvas', label: 'Visual Canvas & Low-code Design' },
            { id: 'templates', label: 'Templates & Starter Experiences' },
            { id: 'real-time-testing', label: 'Real-time Testing' },
          ],
        },
        {
          id: 'topics-conversation',
          label: 'Topics & Conversation Design',
          children: [
            { id: 'specific-topics', label: 'Specific/Curated Topics' },
            { id: 'multilingual-agents', label: 'Multilingual Agents' },
            { id: 'rich-responses', label: 'Rich & Dynamic Responses' },
          ],
        },
        {
          id: 'publish-channels',
          label: 'Publish to Channels',
          children: [
            { id: 'm365-copilot-channel', label: 'Microsoft 365 Copilot' },
            { id: 'teams-channel', label: 'Microsoft Teams' },
            { id: 'custom-channel-runtime', label: 'Web/Custom Channels' },
          ],
        },
      ],
    },
    {
      id: 'language-dialog-orchestration',
      label: 'Language, Dialog & Orchestration',
      children: [
        {
          id: 'language-understanding',
          label: 'Language Understanding',
          children: [
            { id: 'classic-nlu', label: 'Classic NLU' },
            { id: 'builtin-nlu', label: 'Built-in NLU' },
            { id: 'byo-nlu', label: 'Bring-your-own NLU' },
          ],
        },
        {
          id: 'dialog-management',
          label: 'Dialog Management',
          children: [
            { id: 'multi-turn', label: 'Multi-turn Conversations' },
            { id: 'inputs-outputs', label: 'Inputs, Outputs & Variables' },
            { id: 'escalation', label: 'Escalate to Live Agent' },
          ],
        },
        {
          id: 'orchestration-triggers',
          label: 'Orchestration & Triggers',
          children: [
            { id: 'generative-orch', label: 'Generative Orchestration' },
            { id: 'autonomous-triggers', label: 'Autonomous Triggers' },
            { id: 'system-triggers', label: 'System-driven Triggers' },
          ],
        },
      ],
    },
    {
      id: 'knowledge-generative-answers',
      label: 'Knowledge & Generative Answers',
      children: [
        {
          id: 'knowledge-sources',
          label: 'Knowledge Sources',
          children: [
            { id: 'public-websites', label: 'Public Websites' },
            { id: 'dataverse-documents', label: 'Dataverse Documents' },
            { id: 'sharepoint-knowledge', label: 'SharePoint Knowledge' },
          ],
        },
        {
          id: 'enterprise-grounding',
          label: 'Enterprise Grounding',
          children: [
            { id: 'graph-grounding', label: 'Microsoft Graph Grounding' },
            { id: 'connector-grounding', label: 'Enterprise Connectors' },
            { id: 'azure-ai-search', label: 'Azure AI Search Grounding' },
          ],
        },
        {
          id: 'answer-controls',
          label: 'Answer Controls',
          children: [
            { id: 'fallback-pattern', label: 'Fallback with Generative Answers' },
            { id: 'content-moderation', label: 'Content Moderation Levels' },
            { id: 'citations-behavior', label: 'Citations & Response Handling' },
          ],
        },
      ],
    },
    {
      id: 'actions-integrations',
      label: 'Actions & Integrations',
      children: [
        {
          id: 'integration-options',
          label: 'Integration Options',
          children: [
            { id: 'http-requests', label: 'HTTP Requests' },
            { id: 'power-platform-connectors', label: 'Power Platform Connectors' },
            { id: 'bot-framework-skills', label: 'Bot Framework Skills' },
          ],
        },
        {
          id: 'action-patterns',
          label: 'Action Patterns',
          children: [
            { id: 'workflows', label: 'Agent Flows / Workflows' },
            { id: 'generative-actions', label: 'Generative Actions' },
            { id: 'long-running-tasks', label: 'Long-running Tasks' },
          ],
        },
        {
          id: 'pro-dev-extensibility',
          label: 'Pro-dev Extensibility',
          children: [
            { id: 'byom', label: 'Bring your own model (BYOM)' },
            { id: 'custom-knowledge', label: 'Knowledge Base Extension' },
            { id: 'custom-analytics', label: 'Custom Analytics Integration' },
          ],
        },
      ],
    },
    {
      id: 'security-governance',
      label: 'Security & Governance',
      children: [
        {
          id: 'data-policy-controls',
          label: 'Data Policy Controls (DLP)',
          children: [
            { id: 'auth-governance', label: 'Maker/User Authentication Controls' },
            { id: 'knowledge-governance', label: 'Knowledge Source Governance' },
            { id: 'connector-trigger-governance', label: 'Connector/Trigger Governance' },
          ],
        },
        {
          id: 'security-controls',
          label: 'Security Controls',
          children: [
            { id: 'runtime-protection', label: 'Agent Runtime Protection Status' },
            { id: 'security-scan', label: 'Automatic Security Scan' },
            { id: 'cmk-support', label: 'Customer-managed Keys (CMK)' },
          ],
        },
        {
          id: 'audit-compliance',
          label: 'Audit & Compliance',
          children: [
            { id: 'purview-logs', label: 'Microsoft Purview Audit Logs' },
            { id: 'sentinel-logs', label: 'Microsoft Sentinel Monitoring' },
            { id: 'compliance-offerings', label: 'Compliance Offerings & Residency' },
          ],
        },
      ],
    },
    {
      id: 'alm-solutions',
      label: 'ALM & Solutions',
      children: [
        {
          id: 'solution-model',
          label: 'Solution Model',
          children: [
            { id: 'agent-in-solution', label: 'Agents in Power Platform Solutions' },
            { id: 'custom-solutions', label: 'Custom Solutions' },
            { id: 'preferred-solution', label: 'Preferred Solution Setting' },
          ],
        },
        {
          id: 'environment-strategy',
          label: 'Environment Strategy',
          children: [
            { id: 'dev-test-prod', label: 'Dev/Test/Prod Environments' },
            { id: 'ring-deployment', label: 'Ring Deployments' },
            { id: 'environment-routing', label: 'Environment Routing' },
          ],
        },
        {
          id: 'deployment-automation',
          label: 'Deployment Automation',
          children: [
            { id: 'import-export', label: 'Import/Export Solutions' },
            { id: 'solution-pipelines', label: 'Solution Pipelines (CI/CD)' },
            { id: 'managed-layers', label: 'Managed/Unmanaged Layers' },
          ],
        },
      ],
    },
    {
      id: 'analytics-operations',
      label: 'Analytics & Operations',
      children: [
        {
          id: 'analyze-improve',
          label: 'Analyze & Improve Lifecycle',
          children: [
            { id: 'oob-insights', label: 'Out-of-box Insights' },
            { id: 'continuous-improvement', label: 'Continuous Improvement Loop' },
            { id: 'performance-testing', label: 'Performance Testing' },
          ],
        },
        {
          id: 'analytics-telemetry',
          label: 'Analytics & Telemetry',
          children: [
            { id: 'conversation-transcripts', label: 'Conversation Transcripts' },
            { id: 'technical-telemetry', label: 'Technical Telemetry' },
            { id: 'app-insights', label: 'Application Insights Integration' },
          ],
        },
        {
          id: 'platform-services',
          label: 'Connected Platform Services',
          children: [
            { id: 'entra-id', label: 'Microsoft Entra ID' },
            { id: 'azure-monitor-storage', label: 'Azure Monitor / Storage' },
            { id: 'foundry-ai-services', label: 'Foundry & Azure AI Services' },
          ],
        },
      ],
    },
  ],
};

function distanceBetween(
  pointA: { x: number; y: number },
  pointB: { x: number; y: number }
): number {
  const deltaX = pointA.x - pointB.x;
  const deltaY = pointA.y - pointB.y;
  return Math.sqrt(deltaX * deltaX + deltaY * deltaY);
}

function midpoint(pointA: { x: number; y: number }, pointB: { x: number; y: number }) {
  return {
    x: (pointA.x + pointB.x) / 2,
    y: (pointA.y + pointB.y) / 2,
  };
}

function buildLearnSearchUrl(rootTopic: string, nodeTopic: string): string {
  // Only include root topic if it's different from the node topic (avoid duplication for root node)
  const query =
    nodeTopic === rootTopic
      ? `site:learn.microsoft.com ${nodeTopic}`
      : `site:learn.microsoft.com ${nodeTopic} ${rootTopic}`;
  return `https://www.bing.com/search?q=${encodeURIComponent(query)}`;
}

function hasChildren(node: MindMapNode): boolean {
  return Boolean(node.children && node.children.length > 0);
}

function collectDescendantIds(node: MindMapNode): string[] {
  const descendants: string[] = [];

  const walk = (current: MindMapNode) => {
    current.children?.forEach((child) => {
      descendants.push(child.id);
      walk(child);
    });
  };

  walk(node);
  return descendants;
}

function getSubtreeHeight(
  node: MindMapNode,
  expandedNodeIds: Set<string>,
  cache: Map<string, number>
): number {
  const cached = cache.get(node.id);
  if (cached !== undefined) {
    return cached;
  }

  if (!hasChildren(node) || !expandedNodeIds.has(node.id)) {
    cache.set(node.id, NODE_HEIGHT);
    return NODE_HEIGHT;
  }

  const childHeights = (node.children ?? []).map((child) =>
    getSubtreeHeight(child, expandedNodeIds, cache)
  );

  const childrenTotalHeight =
    childHeights.reduce((sum, height) => sum + height, 0) +
    Math.max(0, childHeights.length - 1) * VERTICAL_GAP;

  const height = Math.max(NODE_HEIGHT, childrenTotalHeight);
  cache.set(node.id, height);
  return height;
}

function getNodeX(depth: number): number {
  if (depth === 0) {
    return PADDING_X;
  }

  return PADDING_X + ROOT_WIDTH + HORIZONTAL_GAP + (depth - 1) * (NODE_WIDTH + HORIZONTAL_GAP);
}

function getNodeWidth(depth: number): number {
  return depth === 0 ? ROOT_WIDTH : NODE_WIDTH;
}

function buildLayout(root: MindMapNode, expandedNodeIds: Set<string>) {
  const positionedNodes: PositionedNode[] = [];
  const edges: Array<{ from: string; to: string }> = [];
  const subtreeHeightCache = new Map<string, number>();

  const topChildren = root.children ?? [];
  const topHeights = topChildren.map((child) =>
    getSubtreeHeight(child, expandedNodeIds, subtreeHeightCache)
  );

  const topTotalHeight =
    topHeights.reduce((sum, height) => sum + height, 0) +
    Math.max(0, topChildren.length - 1) * VERTICAL_GAP;

  const rootExpanded = expandedNodeIds.has(root.id);
  const rootCenterY = rootExpanded ? PADDING_Y + topTotalHeight / 2 : PADDING_Y + NODE_HEIGHT / 2;

  positionedNodes.push({
    id: root.id,
    parentId: null,
    node: root,
    depth: 0,
    x: getNodeX(0),
    y: rootCenterY,
  });

  const placeChildren = (parent: MindMapNode, parentCenterY: number, depth: number) => {
    const children = parent.children ?? [];
    if (!children.length) {
      return;
    }

    const childHeights = children.map((child) =>
      getSubtreeHeight(child, expandedNodeIds, subtreeHeightCache)
    );

    const childrenTotalHeight =
      childHeights.reduce((sum, height) => sum + height, 0) +
      Math.max(0, children.length - 1) * VERTICAL_GAP;

    let cursorY = parentCenterY - childrenTotalHeight / 2;

    children.forEach((child, index) => {
      const subtreeHeight = childHeights[index];
      const childCenterY = cursorY + subtreeHeight / 2;

      positionedNodes.push({
        id: child.id,
        parentId: parent.id,
        node: child,
        depth,
        x: getNodeX(depth),
        y: childCenterY,
      });

      edges.push({ from: parent.id, to: child.id });

      if (hasChildren(child) && expandedNodeIds.has(child.id)) {
        placeChildren(child, childCenterY, depth + 1);
      }

      cursorY += subtreeHeight + VERTICAL_GAP;
    });
  };

  if (rootExpanded) {
    placeChildren(root, rootCenterY, 1);
  }

  const nodeMap = new Map(positionedNodes.map((entry) => [entry.id, entry]));

  const connectorPaths: ConnectorPath[] = edges
    .map((edge) => {
      const fromNode = nodeMap.get(edge.from);
      const toNode = nodeMap.get(edge.to);

      if (!fromNode || !toNode) {
        return null;
      }

      const fromX = fromNode.x + getNodeWidth(fromNode.depth);
      const fromY = fromNode.y;
      const toX = toNode.x;
      const toY = toNode.y;

      const curveOffset = Math.max(42, Math.min(120, (toX - fromX) * 0.42));
      const d = `M ${fromX} ${fromY} C ${fromX + curveOffset} ${fromY}, ${toX - curveOffset} ${toY}, ${toX} ${toY}`;

      return {
        id: `${edge.from}->${edge.to}`,
        d,
      };
    })
    .filter((entry): entry is ConnectorPath => Boolean(entry));

  const maxRight = positionedNodes.reduce((max, entry) => {
    const right = entry.x + getNodeWidth(entry.depth);
    return Math.max(max, right);
  }, 0);

  const maxBottom = positionedNodes.reduce((max, entry) => {
    const bottom = entry.y + NODE_HEIGHT / 2;
    return Math.max(max, bottom);
  }, 0);

  return {
    positionedNodes,
    connectorPaths,
    width: maxRight + PADDING_X,
    height: Math.max(520, maxBottom + PADDING_Y),
  };
}

export default function CopilotStudioMindMap() {
  const [expandedNodeIds, setExpandedNodeIds] = useState<Set<string>>(new Set());
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const surfaceRef = useRef<HTMLElement | null>(null);
  const dragStateRef = useRef({
    active: false,
    startX: 0,
    startY: 0,
    originX: 0,
    originY: 0,
  });
  const touchStateRef = useRef<
    | {
        mode: 'none';
      }
    | {
        mode: 'pan';
        startX: number;
        startY: number;
        originX: number;
        originY: number;
      }
    | {
        mode: 'pinch';
        startDistance: number;
        startZoom: number;
        worldX: number;
        worldY: number;
      }
  >({ mode: 'none' });
  const suppressClickRef = useRef(false);
  const [viewportWidth, setViewportWidth] = useState(0);

  const { positionedNodes, connectorPaths, width, height } = useMemo(
    () => buildLayout(copilotStudioTree, expandedNodeIds),
    [expandedNodeIds]
  );
  const frameWidth = Math.max(width + 2 * PADDING_X, 980);
  const scaledWidth = Math.ceil(frameWidth * zoom);
  const scaledHeight = Math.ceil(height * zoom);
  const canvasWidth = Math.max(frameWidth, scaledWidth + Math.abs(Math.min(0, offset.x)));
  const canvasHeight = Math.max(height, scaledHeight + Math.abs(Math.min(0, offset.y)));

  useEffect(() => {
    const element = viewportRef.current;
    if (!element) {
      return;
    }

    const updateWidth = () => {
      setViewportWidth(element.clientWidth);
    };

    updateWidth();

    const observer = new ResizeObserver(updateWidth);
    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, []);

  const fitToView = () => {
    if (!viewportWidth) {
      return;
    }

    const nextZoom = Math.min(1, viewportWidth / frameWidth);
    const boundedZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, nextZoom));
    setZoom(Number(boundedZoom.toFixed(2)));
    setOffset({ x: 0, y: 0 });
  };

  const resetZoom = () => {
    setZoom(1);
    setOffset({ x: 0, y: 0 });
  };

  const applyZoomAtPoint = (nextZoomRaw: number, anchorX: number, anchorY: number) => {
    const boundedZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, nextZoomRaw));

    if (boundedZoom === zoom) {
      return;
    }

    const worldX = (anchorX - offset.x) / zoom;
    const worldY = (anchorY - offset.y) / zoom;

    const nextOffsetX = Math.min(0, anchorX - worldX * boundedZoom);
    const nextOffsetY = Math.min(0, anchorY - worldY * boundedZoom);

    setZoom(Number(boundedZoom.toFixed(2)));
    setOffset({
      x: Number(nextOffsetX.toFixed(2)),
      y: Number(nextOffsetY.toFixed(2)),
    });
  };

  const zoomIn = () => {
    const anchorX = viewportWidth > 0 ? viewportWidth / 2 : frameWidth / 2;
    const anchorY = height / 2;
    applyZoomAtPoint(zoom + ZOOM_STEP, anchorX, anchorY);
  };

  const zoomOut = () => {
    const anchorX = viewportWidth > 0 ? viewportWidth / 2 : frameWidth / 2;
    const anchorY = height / 2;
    applyZoomAtPoint(zoom - ZOOM_STEP, anchorX, anchorY);
  };

  useEffect(() => {
    const surface = surfaceRef.current;
    if (!surface) {
      return;
    }

    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      event.stopPropagation();

      const bounds = surface.getBoundingClientRect();
      const anchorX = event.clientX - bounds.left;
      const anchorY = event.clientY - bounds.top;
      const direction = event.deltaY > 0 ? -1 : 1;

      applyZoomAtPoint(zoom + direction * ZOOM_STEP, anchorX, anchorY);
    };

    surface.addEventListener('wheel', onWheel, { passive: false });

    return () => {
      surface.removeEventListener('wheel', onWheel);
    };
  }, [applyZoomAtPoint, zoom]);

  useEffect(() => {
    const surface = surfaceRef.current;
    if (!surface) {
      return;
    }

    const onTouchStart = (event: TouchEvent) => {
      if (!surfaceRef.current) {
        return;
      }

      if (event.touches.length === 1) {
        const touch = event.touches[0];
        touchStateRef.current = {
          mode: 'pan',
          startX: touch.clientX,
          startY: touch.clientY,
          originX: offset.x,
          originY: offset.y,
        };
        setIsPanning(true);
        return;
      }

      if (event.touches.length === 2) {
        event.preventDefault();
        const bounds = surface.getBoundingClientRect();
        const touchA = event.touches[0];
        const touchB = event.touches[1];
        const pointA = { x: touchA.clientX, y: touchA.clientY };
        const pointB = { x: touchB.clientX, y: touchB.clientY };
        const centerClient = midpoint(pointA, pointB);
        const anchorX = centerClient.x - bounds.left;
        const anchorY = centerClient.y - bounds.top;

        touchStateRef.current = {
          mode: 'pinch',
          startDistance: distanceBetween(pointA, pointB),
          startZoom: zoom,
          worldX: (anchorX - offset.x) / zoom,
          worldY: (anchorY - offset.y) / zoom,
        };

        setIsPanning(true);
      }
    };

    const onTouchMove = (event: TouchEvent) => {
      if (!surfaceRef.current) {
        return;
      }

      const state = touchStateRef.current;
      if (state.mode === 'none') {
        return;
      }

      if (state.mode === 'pan' && event.touches.length === 1) {
        const touch = event.touches[0];
        const deltaX = touch.clientX - state.startX;
        const deltaY = touch.clientY - state.startY;

        if (Math.abs(deltaX) > 2 || Math.abs(deltaY) > 2) {
          suppressClickRef.current = true;
        }

        setOffset({
          x: Number((state.originX + deltaX).toFixed(2)),
          y: Number((state.originY + deltaY).toFixed(2)),
        });

        event.preventDefault();
        return;
      }

      if (state.mode === 'pinch' && event.touches.length === 2) {
        const bounds = surface.getBoundingClientRect();
        const touchA = event.touches[0];
        const touchB = event.touches[1];
        const pointA = { x: touchA.clientX, y: touchA.clientY };
        const pointB = { x: touchB.clientX, y: touchB.clientY };
        const nextDistance = distanceBetween(pointA, pointB);
        const scaleFactor = state.startDistance > 0 ? nextDistance / state.startDistance : 1;
        const nextZoomRaw = state.startZoom * scaleFactor;
        const nextZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, nextZoomRaw));

        const centerClient = midpoint(pointA, pointB);
        const anchorX = centerClient.x - bounds.left;
        const anchorY = centerClient.y - bounds.top;

        const nextOffsetX = Number((anchorX - state.worldX * nextZoom).toFixed(2));
        const nextOffsetY = Number((anchorY - state.worldY * nextZoom).toFixed(2));

        setZoom(Number(nextZoom.toFixed(2)));
        setOffset({ x: nextOffsetX, y: nextOffsetY });

        suppressClickRef.current = true;
        event.preventDefault();
      }
    };

    const onTouchEnd = (event: TouchEvent) => {
      if (event.touches.length === 0) {
        touchStateRef.current = { mode: 'none' };
        setIsPanning(false);
        return;
      }

      if (event.touches.length === 1) {
        const touch = event.touches[0];
        touchStateRef.current = {
          mode: 'pan',
          startX: touch.clientX,
          startY: touch.clientY,
          originX: offset.x,
          originY: offset.y,
        };
        setIsPanning(true);
      }
    };

    surface.addEventListener('touchstart', onTouchStart, { passive: false });
    surface.addEventListener('touchmove', onTouchMove, { passive: false });
    surface.addEventListener('touchend', onTouchEnd, { passive: false });
    surface.addEventListener('touchcancel', onTouchEnd, { passive: false });

    return () => {
      surface.removeEventListener('touchstart', onTouchStart);
      surface.removeEventListener('touchmove', onTouchMove);
      surface.removeEventListener('touchend', onTouchEnd);
      surface.removeEventListener('touchcancel', onTouchEnd);
    };
  }, [offset.x, offset.y, zoom]);

  useEffect(() => {
    const onMouseMove = (event: MouseEvent) => {
      const dragState = dragStateRef.current;
      if (!dragState.active) {
        return;
      }

      const deltaX = event.clientX - dragState.startX;
      const deltaY = event.clientY - dragState.startY;

      if (Math.abs(deltaX) > 2 || Math.abs(deltaY) > 2) {
        suppressClickRef.current = true;
      }

      setOffset({
        x: Number((dragState.originX + deltaX).toFixed(2)),
        y: Number((dragState.originY + deltaY).toFixed(2)),
      });
    };

    const onMouseUp = () => {
      if (!dragStateRef.current.active) {
        return;
      }

      dragStateRef.current.active = false;
      setIsPanning(false);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, []);

  const startPanning = (event: ReactMouseEvent<HTMLElement>) => {
    if (event.button !== 0) {
      return;
    }

    event.preventDefault();

    dragStateRef.current = {
      active: true,
      startX: event.clientX,
      startY: event.clientY,
      originX: offset.x,
      originY: offset.y,
    };

    setIsPanning(true);
  };

  const toggleNode = (node: MindMapNode) => {
    if (!hasChildren(node)) {
      return;
    }

    setExpandedNodeIds((previous) => {
      const next = new Set(previous);

      if (next.has(node.id)) {
        next.delete(node.id);
        collectDescendantIds(node).forEach((descendantId) => next.delete(descendantId));
      } else {
        next.add(node.id);
      }

      return next;
    });
  };

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Mind Maps</h1>
          <div className="flex items-center gap-2">
            <button type="button" className="btn btn-secondary !h-9 px-3" onClick={fitToView}>
              Fit to view
            </button>
            <button type="button" className="btn btn-secondary !h-9 px-3" onClick={resetZoom}>
              100%
            </button>
            <button
              type="button"
              className="btn btn-secondary !h-9 w-9 px-0"
              onClick={zoomOut}
              aria-label="Zoom out"
            >
              −
            </button>
            <span className="inline-flex h-9 min-w-[3.5rem] items-center justify-center rounded-lg border border-slate-300 bg-white px-2 text-xs font-semibold text-slate-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100">
              {Math.round(zoom * 100)}%
            </span>
            <button
              type="button"
              className="btn btn-secondary !h-9 w-9 px-0"
              onClick={zoomIn}
              aria-label="Zoom in"
            >
              +
            </button>
          </div>
        </div>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-200">
          Click a box with an arrow to expand into the next level of sub-topics.
        </p>
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-300">
          Tip: use mouse wheel to zoom at cursor, click-drag to pan, or pinch on touch devices.
        </p>
      </div>

      <div ref={viewportRef} className="pb-2">
        <section
          ref={surfaceRef}
          onMouseDown={startPanning}
          className={`inline-block rounded-3xl border border-slate-700 bg-slate-900 p-6 shadow-xl select-none ${
            isPanning ? 'cursor-grabbing' : 'cursor-grab'
          }`}
        >
          <svg
            width={canvasWidth}
            height={canvasHeight}
            className="block"
            aria-label="Copilot Studio drill-down map"
          >
            <g transform={`translate(${offset.x} ${offset.y}) scale(${zoom})`}>
              {connectorPaths.map((path) => (
                <path
                  key={path.id}
                  d={path.d}
                  fill="none"
                  stroke="rgba(165, 180, 252, 0.78)"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                />
              ))}

              {positionedNodes.map((entry) => {
                const expandable = hasChildren(entry.node);
                const isExpanded = expandedNodeIds.has(entry.id);
                const isRoot = entry.depth === 0;
                const nodeWidth = getNodeWidth(entry.depth);
                const x = entry.x;
                const y = entry.y - NODE_HEIGHT / 2;

                const rectFill = isRoot
                  ? 'rgba(99, 102, 241, 0.26)'
                  : isExpanded
                    ? 'rgba(6, 78, 59, 0.64)'
                    : expandable
                      ? 'rgba(51, 65, 85, 0.9)'
                      : 'rgba(30, 41, 59, 0.92)';

                const rectStroke = isRoot
                  ? 'rgba(99, 102, 241, 0.8)'
                  : isExpanded
                    ? 'rgba(52, 211, 153, 0.85)'
                    : 'rgba(100, 116, 139, 0.9)';

                const onNodeClick = () => {
                  if (suppressClickRef.current) {
                    suppressClickRef.current = false;
                    return;
                  }

                  if (expandable) {
                    toggleNode(entry.node);
                  }
                };

                const onHelpClick = (event: ReactMouseEvent<SVGGElement>) => {
                  event.stopPropagation();
                  const searchUrl = buildLearnSearchUrl(copilotStudioTree.label, entry.node.label);
                  window.open(searchUrl, '_blank', 'noopener,noreferrer');
                };

                return (
                  <g
                    key={entry.id}
                    transform={`translate(${x}, ${y})`}
                    onClick={onNodeClick}
                    className={expandable ? 'cursor-pointer' : ''}
                  >
                    <rect
                      x={0}
                      y={0}
                      width={nodeWidth}
                      height={NODE_HEIGHT}
                      rx={12}
                      fill={rectFill}
                      stroke={rectStroke}
                      strokeWidth={1.4}
                    />

                    {!isRoot && (
                      <circle
                        cx={-11}
                        cy={NODE_HEIGHT / 2}
                        r={8.5}
                        fill="rgba(15, 23, 42, 1)"
                        stroke="rgba(148, 163, 184, 0.75)"
                        strokeWidth={1.2}
                      />
                    )}

                    <text
                      x={22}
                      y={NODE_HEIGHT / 2}
                      fill={isRoot ? 'rgb(224 231 255)' : 'rgb(241 245 249)'}
                      fontSize={16}
                      fontWeight={600}
                      dominantBaseline="middle"
                    >
                      {entry.node.label}
                    </text>

                    <g onClick={onHelpClick} className="cursor-pointer">
                      <circle
                        cx={nodeWidth - 50}
                        cy={NODE_HEIGHT / 2}
                        r={10}
                        fill="rgba(15, 23, 42, 1)"
                        stroke={isRoot ? 'rgba(199, 210, 254, 0.8)' : 'rgba(148, 163, 184, 0.75)'}
                        strokeWidth={1.2}
                      />
                      <text
                        x={nodeWidth - 50}
                        y={NODE_HEIGHT / 2 + 0.5}
                        fill={isRoot ? 'rgb(224 231 255)' : 'rgb(226 232 240)'}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fontSize={14}
                        fontWeight={700}
                      >
                        ?
                      </text>
                    </g>

                    {(expandable || isRoot) && (
                      <g>
                        <circle
                          cx={nodeWidth - 22}
                          cy={NODE_HEIGHT / 2}
                          r={10}
                          fill="rgba(15, 23, 42, 1)"
                          stroke={isRoot ? 'rgba(199, 210, 254, 0.8)' : 'rgba(148, 163, 184, 0.75)'}
                          strokeWidth={1.2}
                        />
                        <text
                          x={nodeWidth - 22}
                          y={NODE_HEIGHT / 2 + 0.5}
                          fill={isRoot ? 'rgb(224 231 255)' : 'rgb(226 232 240)'}
                          textAnchor="middle"
                          dominantBaseline="middle"
                          fontSize={15}
                          fontWeight={700}
                        >
                          {isExpanded ? '−' : '›'}
                        </text>
                      </g>
                    )}
                  </g>
                );
              })}
            </g>
          </svg>
        </section>
      </div>
    </div>
  );
}
