import { useState } from 'react';
import { useUsageStats } from './hooks/useUsageStats';
import { useFeedbackStats } from './hooks/useFeedbackStats';

function formatDate(iso: string) {
    const d = new Date(iso + 'T00:00:00');
    return `${d.getDate()}.${d.getMonth() + 1}.`;
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
            <div className="relative h-48">
                <div className="flex items-end gap-[2px] h-full relative">
                    {data.map((d, i) => (
                        <div key={i} className="flex-1 h-full flex flex-col items-center justify-end">
                            <span className="text-[10px] font-semibold text-base-content/70 mb-0.5">{d.count}</span>
                            <div
                                className="w-full bg-primary/20 rounded-t-sm min-h-[2px] transition-all"
                                style={{ height: `${(d.count / maxVal) * 70}%` }}
                            />
                            <span className="text-[9px] text-base-content/40 mt-0.5 leading-none">{formatDate(d.date)}</span>
                        </div>
                    ))}
                    {/* 7-day MA line overlay */}
                    {days >= 14 && (
                        <svg className="absolute inset-0 w-full h-full pointer-events-none" preserveAspectRatio="none" viewBox="0 0 100 100">
                            <polyline
                                fill="none"
                                stroke="oklch(var(--p))"
                                strokeWidth="1.5"
                                strokeLinejoin="round"
                                points={ma7.map((v, i) => {
                                    const x = (i / (ma7.length - 1)) * 100;
                                    const y = 100 - (v / ma7Max) * 70 - 15;
                                    return `${x},${y}`;
                                }).join(' ')}
                                vectorEffect="non-scaling-stroke"
                            />
                        </svg>
                    )}
                </div>
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

    return (
        <div className="space-y-8">
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
