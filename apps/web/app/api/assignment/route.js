// FILE: apps/web/app/api/assignment/route.js
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../lib/supabaseAdmin';
import { assignInspector } from '../../../lib/assignInspector';

export async function POST(request) {
  try {
    const { inspection_id } = await request.json();
    if (!inspection_id) {
      return NextResponse.json({ error: 'inspection_id is required' }, { status: 400 });
    }

    const { data: inspection, error: inspectionError } = await supabaseAdmin
      .from('inspections')
      .select('id, institute_id, inspector_id')
      .eq('id', inspection_id)
      .single();

    if (inspectionError || !inspection) {
      return NextResponse.json({ error: 'Inspection not found' }, { status: 404 });
    }
    if (inspection.inspector_id) {
      return NextResponse.json({ error: 'Inspector already assigned to this inspection' }, { status: 409 });
    }

    const { data: institute, error: instituteError } = await supabaseAdmin
      .from('institutes')
      .select('id, name, region, state, district')
      .eq('id', inspection.institute_id)
      .single();
    if (instituteError || !institute) {
      return NextResponse.json({ error: 'Institute not found' }, { status: 404 });
    }

    const { data: candidateInspectors, error: inspectorsError } = await supabaseAdmin
      .from('inspectors')
      .select('id, user_id, home_region, specialization, availability_status, current_workload')
      .eq('availability_status', 'available');
    if (inspectorsError) {
      return NextResponse.json({ error: inspectorsError.message }, { status: 500 });
    }

    // Conflict-of-interest source: has this inspector (as users.id) ever been assigned to this institute before?
    const { data: priorInspections, error: priorError } = await supabaseAdmin
      .from('inspections')
      .select('inspector_id')
      .eq('institute_id', institute.id)
      .not('inspector_id', 'is', null);
    if (priorError) {
      return NextResponse.json({ error: priorError.message }, { status: 500 });
    }

    const { assignedInspector, reason } = assignInspector({
      institute,
      candidateInspectors: candidateInspectors || [],
      priorInspectorIdsForInstitute: priorInspections.map((i) => i.inspector_id),
    });

    if (!assignedInspector) {
      return NextResponse.json({ error: 'No eligible inspector available', reason }, { status: 422 });
    }

    // inspections.inspector_id -> users.id, NOT inspectors.id
    const { error: updateError } = await supabaseAdmin
      .from('inspections')
      .update({
        inspector_id: assignedInspector.user_id,
        assignment_reason: reason,
      })
      .eq('id', inspection_id);
    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    const { error: workloadError } = await supabaseAdmin
      .from('inspectors')
      .update({ current_workload: (assignedInspector.current_workload || 0) + 1 })
      .eq('id', assignedInspector.id);
    if (workloadError) {
      return NextResponse.json({ error: workloadError.message }, { status: 500 });
    }

    return NextResponse.json({ assignedInspector, reason });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}