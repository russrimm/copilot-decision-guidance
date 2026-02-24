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
      id: 'agent-design',
      label: 'Agent Design',
      children: [
        {
          id: 'conversation-design',
          label: 'Conversation Design',
          children: [
            { id: 'instructions-goals', label: 'Instructions & Goals' },
            { id: 'topic-triggers', label: 'Topic Triggers' },
            { id: 'fallback-escalation', label: 'Fallback & Escalation' },
          ],
        },
        {
          id: 'knowledge-grounding',
          label: 'Knowledge & Grounding',
          children: [
            { id: 'website-file-sources', label: 'Website & File Sources' },
            { id: 'sharepoint-graph-grounding', label: 'M365 Grounding' },
            { id: 'response-quality-rules', label: 'Response Quality Rules' },
          ],
        },
        {
          id: 'testing-evaluation',
          label: 'Testing & Evaluation',
          children: [
            { id: 'test-utterances', label: 'Test Utterances' },
            { id: 'conversation-transcripts', label: 'Transcript Review' },
            { id: 'improvement-loop', label: 'Iteration Loop' },
          ],
        },
      ],
    },
    {
      id: 'automation',
      label: 'Automation & Actions',
      children: [
        {
          id: 'power-automate-flows',
          label: 'Power Automate Flows',
          children: [
            { id: 'instant-cloud-flows', label: 'Instant Cloud Flows' },
            { id: 'approval-patterns', label: 'Approval Patterns' },
            { id: 'error-handling-flow', label: 'Error Handling & Retries' },
          ],
        },
        {
          id: 'connector-strategy',
          label: 'Connectors',
          children: [
            { id: 'standard-connectors', label: 'Standard Connectors' },
            { id: 'premium-connectors', label: 'Premium Connectors' },
            { id: 'custom-connectors', label: 'Custom Connectors' },
          ],
        },
        {
          id: 'business-processes',
          label: 'Business Processes',
          children: [
            { id: 'ticketing-scenarios', label: 'Support/Ticketing' },
            { id: 'hr-onboarding-scenarios', label: 'HR Onboarding' },
            { id: 'operations-assistants', label: 'Ops Assistants' },
          ],
        },
      ],
    },
    {
      id: 'channels',
      label: 'Channels & Experience',
      children: [
        {
          id: 'microsoft-channels',
          label: 'Microsoft Channels',
          children: [
            { id: 'teams-channel', label: 'Microsoft Teams' },
            { id: 'm365-copilot-extension', label: 'M365 Copilot Extension' },
            { id: 'sharepoint-channel', label: 'SharePoint' },
          ],
        },
        {
          id: 'external-channels',
          label: 'External Channels',
          children: [
            { id: 'web-embed', label: 'Web Embed' },
            { id: 'omnichannel-dynamics', label: 'Dynamics Omnichannel' },
            { id: 'custom-channel', label: 'Custom Channel Integration' },
          ],
        },
        {
          id: 'ux-patterns',
          label: 'UX Patterns',
          children: [
            { id: 'handoff-patterns', label: 'Human Handoff' },
            { id: 'adaptive-card-patterns', label: 'Cards & Forms' },
            { id: 'multilingual-strategy', label: 'Multi-language Strategy' },
          ],
        },
      ],
    },
    {
      id: 'security-governance',
      label: 'Security & Governance',
      children: [
        {
          id: 'environment-security',
          label: 'Environment Security',
          children: [
            { id: 'security-groups', label: 'Security Groups' },
            { id: 'environment-roles', label: 'Environment Roles' },
            { id: 'admin-center-management', label: 'Admin Center Management' },
          ],
        },
        {
          id: 'dataverse-security',
          label: 'Dataverse Security',
          children: [
            { id: 'role-based-security', label: 'Role-Based Security' },
            { id: 'business-units-teams', label: 'Business Units & Teams' },
            { id: 'field-level-security', label: 'Field/Column-Level Security' },
          ],
        },
        {
          id: 'compliance-controls',
          label: 'Compliance Controls',
          children: [
            { id: 'dlp-policies', label: 'DLP Policies' },
            { id: 'audit-logging', label: 'Audit Logging' },
            { id: 'managed-environments', label: 'Managed Environments' },
          ],
        },
      ],
    },
    {
      id: 'operations',
      label: 'Operations & Lifecycle',
      children: [
        {
          id: 'release-management',
          label: 'Release Management',
          children: [
            { id: 'solution-packaging', label: 'Solution Packaging' },
            { id: 'environment-promotion', label: 'Environment Promotion' },
            { id: 'rollback-plans', label: 'Rollback Strategy' },
          ],
        },
        {
          id: 'monitoring',
          label: 'Monitoring',
          children: [
            { id: 'conversation-analytics', label: 'Conversation Analytics' },
            { id: 'failure-alerts', label: 'Failure Alerts' },
            { id: 'feedback-loop', label: 'User Feedback Loop' },
          ],
        },
        {
          id: 'platform-adoption',
          label: 'Adoption & Enablement',
          children: [
            { id: 'maker-guidelines', label: 'Maker Guidelines' },
            { id: 'support-model', label: 'Support Model' },
            { id: 'success-metrics', label: 'Success Metrics' },
          ],
        },
      ],
    },
  ],
};

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
  const topHeights = topChildren.map((child) => getSubtreeHeight(child, expandedNodeIds, subtreeHeightCache));

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

  const placeChildren = (
    parent: MindMapNode,
    parentCenterY: number,
    depth: number
  ) => {
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
          Tip: use your mouse wheel over the map to zoom at the cursor position, and click-drag
          to pan.
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
          <svg width={canvasWidth} height={canvasHeight} className="block" aria-label="Copilot Studio drill-down map">
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
