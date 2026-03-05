import { useState } from 'react';
import { useUsageStats } from './hooks/useUsageStats';
import { useFeedbackStats } from './hooks/useFeedbackStats';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

function DeltaIndicator({ current, previous }: { current: number; previous: number }) {
    if (previous === 0 && current === 0) return <span className="text-xs text-base-content/40">—</span>;
    if (previous === 0) return <span className="text-xs text-success flex items-center gap-0.5"><TrendingUp className="w-3 h-3" /> nový</span>;

    const pct = Math.round(((current - previous) / previous) * 100);
    if (pct === 0) return <span className="text-xs text-base-content/40 flex items-center gap-0.5"><Minus className="w-3 h-3" /> beze změny</span>;
    if (pct > 0) return <span className="text-xs text-success flex items-center gap-0.5"><TrendingUp className="w-3 h-3" /> +{pct} %</span>;
    return <span className="text-xs text-error flex items-center gap-0.5"><TrendingDown className="w-3 h-3" /> {pct} %</span>;
}

function StatCard({ label, value, subtitle, previous }: { label: string; value: number | string; subtitle: string; previous?: number }) {
    return (
        <div className="bg-base-100 rounded-lg border border-base-300 shadow-sm p-4">
            <div className="text-sm text-base-content/60 mb-1">{label}</div>
            <div className="text-3xl font-bold tracking-tight">{value}</div>
            <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-base-content/40">{subtitle}</span>
                {previous !== undefined && <DeltaIndicator current={Number(value)} previous={previous} />}
            </div>
        </div>
    );
}

function TrendChart({ data, days }: { data: { date: string; count: number }[]; days: number }) {
    if (!data.length) return null;
    const maxVal = Math.max(...data.map(d => d.count), 1);

    // 7-day moving average
    const ma7 = data.map((_, i) => {
        const slice = data.slice(Math.max(0, i - 6), i + 1);
        return slice.reduce((s, d) => s + d.count, 0) / slice.length;
    });
    const ma7Max = Math.max(...ma7, 1);

    return (
        <div>
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold">Denní aktivní uživatelé</h3>
                <div className="flex items-center gap-3 text-[10px] text-base-content/50">
                    <span className="flex items-center gap-1"><span className="w-3 h-1 bg-primary/30 rounded" /> denně</span>
                    {days >= 14 && <span className="flex items-center gap-1"><span className="w-3 h-1 bg-primary rounded" /> 7denní průměr</span>}
                </div>
            </div>
            <div className="relative h-40 flex">
                {/* Y-axis labels */}
                <div className="flex flex-col justify-between text-[10px] text-base-content/40 pr-2 py-0.5 shrink-0 w-6 text-right">
                    <span>{maxVal}</span>
                    <span>{Math.round(maxVal / 2)}</span>
                    <span>0</span>
                </div>
                {/* Bars */}
                <div className="flex items-end gap-[2px] h-full flex-1 relative">
                    {data.map((d, i) => (
                        <div key={i} className="flex-1 h-full flex items-end group relative">
                            <div
                                className="w-full bg-primary/20 rounded-t-sm min-h-[2px] transition-all"
                                style={{ height: `${(d.count / maxVal) * 100}%` }}
                            />
                            <div className="hidden group-hover:block absolute -top-8 left-1/2 -translate-x-1/2 bg-base-300 text-xs px-2 py-1 rounded whitespace-nowrap z-10">
                                {d.date}: {d.count}
                            </div>
                        </div>
                    ))}
                    {/* 7-day MA line overlay */}
                    {days >= 14 && (
                        <svg className="absolute inset-0 w-full h-full pointer-events-none" preserveAspectRatio="none">
                            <polyline
                                fill="none"
                                stroke="oklch(var(--p))"
                                strokeWidth="2"
                                strokeLinejoin="round"
                                points={ma7.map((v, i) => {
                                    const x = (i / (ma7.length - 1)) * 100;
                                    const y = 100 - (v / ma7Max) * 100;
                                    return `${x},${y}`;
                                }).join(' ')}
                                vectorEffect="non-scaling-stroke"
                            />
                        </svg>
                    )}
                </div>
            </div>
            <div className="flex justify-between text-[10px] text-base-content/40 mt-1">
                <span>{data[0]?.date}</span>
                <span>{data[data.length - 1]?.date}</span>
            </div>
        </div>
    );
}

function RatingBar({ rating, count, maxCount }: { rating: string; count: number; maxCount: number }) {
    const pct = maxCount > 0 ? (count / maxCount) * 100 : 0;
    return (
        <div className="flex items-center gap-3">
            <span className="text-sm font-medium w-4 text-right">{rating}</span>
            <div className="flex-1 h-5 bg-base-200 rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${pct}%` }} />
            </div>
            <span className="text-sm text-base-content/60 w-6">{count}</span>
        </div>
    );
}

export default function AnalyticsView() {
    const [days, setDays] = useState(30);
    const [semesterFilter, setSemesterFilter] = useState<string>();

    const { stats: usage, loading: usageLoading } = useUsageStats(days);
    const { stats: feedback, loading: feedbackLoading } = useFeedbackStats(semesterFilter);

    if (usageLoading || feedbackLoading) {
        return (
            <div className="flex items-center justify-center py-20">
                <span className="loading loading-spinner loading-lg text-primary" />
            </div>
        );
    }

    const stickinessDisplay = usage ? `${Math.round(usage.stickiness * 100)} %` : '—';

    return (
        <div className="space-y-8">
            {/* Key Metrics */}
            <section>
                <h2 className="text-xl font-bold mb-4">Přehled</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <StatCard
                        label="Uživatelé dnes"
                        value={usage?.dau ?? 0}
                        subtitle="vs. včera"
                        previous={usage?.dauPrev}
                    />
                    <StatCard
                        label="Tento týden"
                        value={usage?.wau ?? 0}
                        subtitle="vs. předchozí týden"
                        previous={usage?.wauPrev}
                    />
                    <StatCard
                        label="Tento měsíc"
                        value={usage?.mau ?? 0}
                        subtitle="vs. předchozí měsíc"
                        previous={usage?.mauPrev}
                    />
                    <StatCard
                        label="Zapojení"
                        value={stickinessDisplay}
                        subtitle="denní / měsíční uživatelé"
                    />
                </div>
            </section>

            {/* Trend */}
            <section>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold">Vývoj</h2>
                    <select
                        className="select select-sm select-bordered"
                        value={days}
                        onChange={e => setDays(Number(e.target.value))}
                    >
                        <option value={7}>7 dní</option>
                        <option value={30}>30 dní</option>
                        <option value={90}>90 dní</option>
                    </select>
                </div>
                <div className="bg-base-100 rounded-lg border border-base-300 p-4">
                    {usage?.dailyTrend && <TrendChart data={usage.dailyTrend} days={days} />}
                </div>
            </section>

            {/* Feedback */}
            <section>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold">Hodnocení uživatelů</h2>
                    <div className="flex gap-2">
                        {feedback?.semesters && feedback.semesters.length > 0 && (
                            <select
                                className="select select-sm select-bordered"
                                value={semesterFilter ?? ''}
                                onChange={e => setSemesterFilter(e.target.value || undefined)}
                            >
                                <option value="">Všechny semestry</option>
                                {feedback.semesters.map(s => (
                                    <option key={s} value={s}>{s}</option>
                                ))}
                            </select>
                        )}
                    </div>
                </div>
                <div className="grid md:grid-cols-2 gap-6">
                    <div className="bg-base-100 rounded-lg border border-base-300 p-5">
                        <h3 className="text-sm font-semibold mb-4">Rozložení hodnocení</h3>
                        <div className="space-y-2">
                            {feedback?.npsDistribution?.map(d => (
                                <RatingBar
                                    key={d.rating}
                                    rating={d.rating}
                                    count={d.count}
                                    maxCount={Math.max(...(feedback.npsDistribution?.map(x => x.count) ?? [1]))}
                                />
                            ))}
                        </div>
                    </div>
                    <div className="bg-base-100 rounded-lg border border-base-300 p-5 flex flex-col justify-center">
                        <div className="text-center">
                            <div className="text-5xl font-bold text-primary">{feedback?.avgNps ?? '—'}</div>
                            <div className="text-sm text-base-content/60 mt-2">Průměrné hodnocení</div>
                            {(feedback?.totalResponses ?? 0) < 30 && (
                                <div className="text-xs text-warning mt-3">
                                    Málo odpovědí ({feedback?.totalResponses ?? 0}) — výsledky nemusí být reprezentativní
                                </div>
                            )}
                            {(feedback?.totalResponses ?? 0) >= 30 && (
                                <div className="text-xs text-base-content/40 mt-3">
                                    Celkem odpovědí: {feedback?.totalResponses}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
