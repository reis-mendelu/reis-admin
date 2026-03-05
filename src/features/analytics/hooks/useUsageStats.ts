import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export interface UsageStats {
    dau: number;
    dauPrev: number;
    wau: number;
    wauPrev: number;
    mau: number;
    mauPrev: number;
    stickiness: number; // DAU/MAU ratio (0-1)
    stickinessPrev: number;
    dailyTrend: { date: string; count: number }[];
}

function uniqueUsers(rows: { student_id: string; usage_date: string }[], from: string, to: string) {
    return new Set(rows.filter(r => r.usage_date >= from && r.usage_date <= to).map(r => r.student_id)).size;
}

export function useUsageStats(days = 30) {
    const [stats, setStats] = useState<UsageStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats();
    }, [days]);

    async function fetchStats() {
        setLoading(true);
        const today = new Date().toISOString().split('T')[0];
        const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
        const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];
        const twoWeeksAgo = new Date(Date.now() - 14 * 86400000).toISOString().split('T')[0];
        const monthAgo = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];
        const twoMonthsAgo = new Date(Date.now() - 60 * 86400000).toISOString().split('T')[0];

        // Fetch enough data for current + previous period comparisons
        const fetchStart = new Date(Date.now() - Math.max(days, 60) * 86400000).toISOString().split('T')[0];

        const { data: rows } = await supabase
            .from('daily_active_usage')
            .select('student_id, usage_date')
            .gte('usage_date', fetchStart)
            .lte('usage_date', today);

        if (!rows) { setLoading(false); return; }

        const dau = uniqueUsers(rows, today, today);
        const dauPrev = uniqueUsers(rows, yesterday, yesterday);

        const wau = uniqueUsers(rows, weekAgo, today);
        const wauPrev = uniqueUsers(rows, twoWeeksAgo, weekAgo);

        const mau = uniqueUsers(rows, monthAgo, today);
        const mauPrev = uniqueUsers(rows, twoMonthsAgo, monthAgo);

        const stickiness = mau > 0 ? dau / mau : 0;
        const stickinessPrev = mauPrev > 0 ? dauPrev / mauPrev : 0;

        // Daily trend for the selected period
        const startDate = new Date(Date.now() - days * 86400000).toISOString().split('T')[0];
        const byDate: Record<string, Set<string>> = {};
        for (const r of rows) {
            if (r.usage_date < startDate) continue;
            if (!byDate[r.usage_date]) byDate[r.usage_date] = new Set();
            byDate[r.usage_date].add(r.student_id);
        }

        const dailyTrend = Object.entries(byDate)
            .map(([date, set]) => ({ date, count: set.size }))
            .sort((a, b) => a.date.localeCompare(b.date));

        setStats({ dau, dauPrev, wau, wauPrev, mau, mauPrev, stickiness, stickinessPrev, dailyTrend });
        setLoading(false);
    }

    return { stats, loading };
}
