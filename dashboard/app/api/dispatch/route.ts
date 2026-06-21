import { NextResponse } from 'next/server';
import { sipClient, roomService, agentDispatchClient } from '@/lib/server-utils';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { data: profile } = await supabase
            .from("profiles")
            .select("business_id, role")
            .eq("auth_user_id", user.id)
            .single();

        let workspaceId = profile?.business_id;

        if (profile?.role === "super_admin") {
            const cookieStore = await cookies();
            const activeWorkspaceId = cookieStore.get("active_workspace_id")?.value;
            if (activeWorkspaceId) {
                workspaceId = activeWorkspaceId;
            }
        }

        if (!workspaceId) {
            return NextResponse.json({ error: "No workspace associated" }, { status: 403 });
        }

        const body = await request.json();
        const { phoneNumber, prompt, modelProvider, voice } = body;

        if (!phoneNumber) {
            return NextResponse.json({ error: "Phone number is required" }, { status: 400 });
        }

        const trunkId = process.env.VOBIZ_SIP_TRUNK_ID;
        if (!trunkId) {
            console.error("VOBIZ_SIP_TRUNK_ID is missing in env");
            return NextResponse.json({ error: "SIP Trunk not configured" }, { status: 500 });
        }

        // Generate a unique room name for this call with workspace ID embedded
        const shortWorkspaceId = workspaceId.slice(0, 8);
        const roomName = `ws-${shortWorkspaceId}-${Date.now()}`;
        const participantIdentity = `sip_${phoneNumber}`;

        const metadata = JSON.stringify({
            phone_number: phoneNumber,
            user_prompt: prompt || "",
            model_provider: modelProvider || "openai",
            voice_id: voice || "alloy",
            tts_provider: body.ttsProvider,
            tts_language: body.ttsLanguage,
            workspace_id: workspaceId,
            triggered_by: user.email,
        });

        console.log(`[DISPATCH] Step 1: Creating room ${roomName}`);

        // STEP 1: Create the room explicitly with metadata
        await roomService.createRoom({
            name: roomName,
            metadata: metadata,
            emptyTimeout: 60 * 10, // 10 minutes
        });

        console.log(`[DISPATCH] Step 2: Dispatching agent 'outbound-caller' to room ${roomName}`);

        // STEP 2: Tell the agent worker to join this room
        // The agent name "outbound-caller" must match agent.py's WorkerOptions.agent_name
        const dispatch = await agentDispatchClient.createDispatch(roomName, "outbound-caller", {
            metadata: metadata,
        });

        console.log(`[DISPATCH] Agent dispatched. Dispatch ID: ${dispatch.id}`);
        // NOTE: The agent (agent_outbound.py) handles the SIP dial-out itself
        // via create_sip_participant. Do NOT call sipClient here — it causes a double-dial.

        return NextResponse.json({
            success: true,
            roomName,
            dispatchId: dispatch.id,
        });

    } catch (error: any) {
        console.error("Error dispatching call:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}
