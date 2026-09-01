// FILE: apps/web/app/api/risk/recompute/route.js

import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../lib/supabaseAdmin';

export async function POST(request) {
  const { instituteId } = await request.json();

  if (!instituteId) {
    return NextResponse.json({ error: 'instituteId is required' }, { status: 400 });
  }

  // 1. Attendance history → computed deviation
  const { data: attendanceRows, error: attendanceError } = await supabaseAdmin
    .from('attendance')
    .select('reported_count, created_at')
    .eq('institute_id', instituteId)
    .order('created_at', { ascending: false })
    .limit(10);

  if (attendanceError) {
    return NextResponse.json({ error: attendanceError.message }, { status: 500 });
  }

  let attendanceDeviationPct = null;
  if (attendanceRows?.length >= 2) {
    const [latest, ...previous] = attendanceRows;
    const computedAverage =
      previous.reduce((sum, r) => sum + r.reported_count, 0) / previous.length;

    if (computedAverage > 0) {
      attendanceDeviationPct = Math.round(
        (Math.abs(latest.reported_count - computedAverage) / computedAverage) * 100
      );
    }
  }

  // 2. CCTV status
  const { data: cameras } = await supabaseAdmin
    .from('cctv_cameras')
    .select('id')
    .eq('institute_id', instituteId);

  let cctvOffline = false;
  if (cameras?.length) {
    const cameraIds = cameras.map((c) => c.id);
    const { data: latestStatusRows } = await supabaseAdmin
      .from('cctv_status_log')
      .select('status, checked_at')
      .in('camera_id', cameraIds)
      .order('checked_at', { ascending: false })
      .limit(1);

    cctvOffline = latestStatusRows?.[0]?.status === 'offline';
  }

  // 3. Report similarity — needs at least the 2 most recent reports to compare
  const { data: reportRows } = await supabaseAdmin
    .from('reports')
    .select('id, content_text, created_at')
    .eq('institute_id', instituteId)
    .order('created_at', { ascending: false })
    .limit(2);

  let reportSimilarityPct = null;
  let latestReportId = null;

  if (reportRows?.length === 2) {
    const [current, previous] = reportRows;
    latestReportId = current.id;

    try {
      const simResponse = await fetch(`${process.env.AI_SERVICE_URL}/similarity`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          current_text: current.content_text,
          previous_text: previous.content_text,
        }),
      });

      if (simResponse.ok) {
        const simResult = await simResponse.json();
        reportSimilarityPct = simResult.similarity_pct;
      }
      // If this call fails, we deliberately don't block the whole recompute —
      // reportSimilarityPct just stays null and that signal is skipped.
    } catch {
      // Same reasoning — a failed similarity check shouldn't break the rest of scoring.
    }
  }

  // 4. Call the main scoring endpoint with all three signals
  let aiResult;
  try {
    const aiResponse = await fetch(`${process.env.AI_SERVICE_URL}/score`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        institute_id: instituteId,
        attendance_deviation_pct: attendanceDeviationPct,
        cctv_offline: cctvOffline,
        report_similarity_pct: reportSimilarityPct,
      }),
    });

    const responseText = await aiResponse.text();

    if (!aiResponse.ok) {
      return NextResponse.json(
        { error: `AI service returned ${aiResponse.status}: ${responseText}` },
        { status: 502 }
      );
    }

    aiResult = JSON.parse(responseText);
  } catch (err) {
    return NextResponse.json(
      { error: `Could not reach AI service at ${process.env.AI_SERVICE_URL}. Is it running? (${err.message})` },
      { status: 502 }
    );
  }

  // 5. Store the similarity score back onto the report itself, for the monitoring page to display
  if (latestReportId && reportSimilarityPct !== null) {
    await supabaseAdmin
      .from('reports')
      .update({ similarity_score: reportSimilarityPct / 100 })
      .eq('id', latestReportId);
  }

  // 6. Store the risk score result
  const { error: insertError } = await supabaseAdmin.from('risk_scores').insert({
    institute_id: instituteId,
    score: aiResult.score,
    band: aiResult.band,
    reasons: aiResult.reasons,
    trigger_source: 'ingestion',
  });

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  return NextResponse.json(aiResult);
}