import { useEffect, useState } from 'react';

type InfographicEntry = {
  id: string;
  title: string;
  imagePath: string;
  imageFallbackPath?: string;
  imageAlt: string;
  description: string;
  imageCtaHref?: string;
  imageCtaLabel?: string;
};

const INFOGRAPHICS_MANIFEST_PATH = '/executive-overview-infographics.json';

const fallbackInfographicEntries: InfographicEntry[] = [
  {
    id: 'copilot-studio-in-your-industry',
    title: 'Microsoft Copilot Studio in Your Industry',
    imagePath: '/copilot.png',
    imageAlt:
      'Industry use-case visual for Microsoft Copilot Studio showing sector examples and ROI callouts',
    description:
      'This visual highlights example Copilot Studio agent scenarios by industry and includes a direct call to action for trying Copilot Studio.',
    imageCtaHref: 'https://aka.ms/copilotstudio',
    imageCtaLabel: 'Try it out: aka.ms/copilotstudio',
  },
  {
    id: 'copilot-studio-ecosystem-interconnected',
    title: 'Copilot Studio Ecosystem Interconnected',
    imagePath: '/Copilot Studio Ecosystem Interconnected.png',
    imageAlt:
      'Diagram showing the interconnected relationship among Copilot Studio, Microsoft 365 Copilot, and Microsoft Foundry',
    description:
      'This infographic gives executives a system-level view of how Copilot Studio connects business process automation and agent orchestration with Microsoft 365 Copilot productivity experiences and Microsoft Foundry AI engineering capabilities. Use this view to align ownership, governance, and investment priorities across business, IT, and data/AI teams.',
  },
  {
    id: 'copilot-studio-ecosystem-orchestration',
    title: 'Copilot Studio Ecosystem Orchestration',
    imagePath: '/Copilot Studio Ecosystem Orchestration.png',
    imageAlt:
      'Orchestration view of Copilot Studio interactions across Microsoft 365 Copilot and Microsoft Foundry services',
    description:
      'This infographic focuses on orchestration flow. It helps executive teams understand how Copilot Studio can coordinate intents, actions, and integrations across enterprise systems while Microsoft 365 Copilot and Microsoft Foundry contribute user experience and advanced AI capabilities. Use this to clarify operational boundaries and platform accountability.',
  },
  {
    id: 'knowledge-ecosystem',
    title: 'Knowledge Ecosystem',
    imagePath: '/Knowwledge Ecosystem.png',
    imageAlt:
      'Knowledge ecosystem diagram showing data and knowledge relationships across Microsoft Copilot services',
    description:
      'This infographic highlights the knowledge layer that powers consistent agent behavior and trustworthy outcomes. It is useful for executive discussions about data readiness, governance, and retrieval strategy across Copilot Studio, Microsoft 365 Copilot, and Microsoft Foundry scenarios.',
  },
  {
    id: 'copilot-studio-vs-azure-ai-foundry',
    title: 'Copilot Studio vs Azure AI Foundry',
    imagePath: '/Copilot Studio vs Azure AI Foundry.png',
    imageAlt: 'Comparison infographic of Copilot Studio and Azure AI Foundry capabilities',
    description:
      'This infographic compares Copilot Studio and Azure AI Foundry across platform model, extensibility, governance, and delivery patterns. Use it to align stakeholders on when to prioritize rapid low-code agent delivery versus pro-dev AI engineering control.',
  },
  {
    id: 'journey-of-a-prompt',
    title: 'Journey of a Prompt',
    imagePath: '/Journey of a Prompt.png',
    imageAlt:
      'Infographic illustrating the end-to-end journey of a prompt through Microsoft AI systems',
    description:
      'This infographic explains how a user prompt travels through grounding, orchestration, model inference, and response delivery. Use it to align technical and business stakeholders on latency, governance checkpoints, and operational responsibilities across the prompt lifecycle.',
  },
];

const normalizeEntry = (entry: Partial<InfographicEntry>): InfographicEntry | null => {
  if (!entry.id || !entry.title || !entry.imagePath) {
    return null;
  }

  return {
    id: entry.id,
    title: entry.title,
    imagePath: entry.imagePath,
    imageFallbackPath: entry.imageFallbackPath,
    imageAlt: entry.imageAlt ?? `${entry.title} infographic`,
    description:
      entry.description ??
      'Executive infographic covering platform relationships, operating model implications, and strategic planning considerations.',
    imageCtaHref: entry.imageCtaHref,
    imageCtaLabel: entry.imageCtaLabel,
  };
};

export default function ExecutiveOverview() {
  const [infographicEntries, setInfographicEntries] = useState<InfographicEntry[]>(
    fallbackInfographicEntries
  );

  useEffect(() => {
    let isActive = true;

    const loadManifest = async () => {
      try {
        const response = await fetch(INFOGRAPHICS_MANIFEST_PATH, { cache: 'no-store' });

        if (!response.ok) {
          return;
        }

        const raw = (await response.json()) as Partial<InfographicEntry>[];
        const normalized = raw
          .map((entry) => normalizeEntry(entry))
          .filter((entry): entry is InfographicEntry => entry !== null);

        if (isActive && normalized.length > 0) {
          setInfographicEntries(normalized);
        }
      } catch {
        return;
      }
    };

    void loadManifest();

    return () => {
      isActive = false;
    };
  }, []);

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white md:text-4xl">
          Executive Overview: Microsoft Copilot Ecosystem
        </h1>
        <p className="mt-4 max-w-4xl text-base leading-relaxed text-gray-600 dark:text-gray-100">
          This page is designed for executive briefings. Each infographic highlights how core
          Microsoft agentic platforms relate to each other and where they create business value.
        </p>
      </section>

      <section className="space-y-6">
        {infographicEntries.map((entry) => (
          <article
            key={entry.id}
            className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800"
          >
            <div className="border-b border-slate-200 px-6 py-5 dark:border-slate-700">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                {entry.title}
              </h2>
            </div>

            <div className="space-y-5 p-6">
              <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-900/40">
                <img
                  src={encodeURI(entry.imagePath)}
                  alt={entry.imageAlt}
                  className="h-auto w-full object-contain"
                  loading="lazy"
                  onError={(event) => {
                    const fallbackPath = entry.imageFallbackPath;

                    if (!fallbackPath) {
                      event.currentTarget.onerror = null;
                      return;
                    }

                    event.currentTarget.onerror = null;
                    event.currentTarget.src = encodeURI(fallbackPath);
                  }}
                />
                {entry.imageCtaHref ? (
                  <a
                    href={entry.imageCtaHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="absolute bottom-4 right-4 inline-flex h-10 items-center justify-center rounded-lg bg-white/95 px-3 text-xs font-semibold text-slate-900 shadow-sm ring-1 ring-slate-300 transition hover:bg-white dark:bg-slate-900/95 dark:text-slate-100 dark:ring-slate-600"
                    aria-label={entry.imageCtaLabel ?? 'Open related link'}
                  >
                    {entry.imageCtaLabel ?? 'Open link'}
                  </a>
                ) : null}
              </div>

              <p className="text-base leading-relaxed text-gray-700 dark:text-gray-100">
                {entry.description}
              </p>

              <a
                href={encodeURI(entry.imageFallbackPath ?? entry.imagePath)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-11 items-center justify-center rounded-xl border border-primary-300 bg-primary-50 px-4 text-sm font-semibold text-primary-700 transition-all hover:bg-primary-100 dark:border-primary-700 dark:bg-primary-900/20 dark:text-primary-300 dark:hover:bg-primary-900/30"
              >
                Open Full-Size Image
              </a>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
