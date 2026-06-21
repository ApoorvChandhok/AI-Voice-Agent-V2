import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { roomService } from '@/lib/server-utils';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { data: profile } = await supabase
            .from("profiles")
            .select("role")
            .eq("auth_user_id", user.id)
            .single();

        if (profile?.role !== "super_admin") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const rooms = await roomService.listRooms();
        
        // Enrich rooms with metadata and calculate duration
        const enrichedRooms = await Promise.all(rooms.map(async (room) => {
            let meta: any = {};
            try {
                if (room.metadata) {
                    meta = JSON.parse(room.metadata);
                }
            } catch (e) {
                console.error("Failed to parse room metadata", e);
            }
            
            const creationTimeMs = room.creationTime ? Number(room.creationTime) * 1000 : Date.now();
            const durationMs = Date.now() - creationTimeMs;
            
            // Get workspace name if possible
            let workspaceName = "Unknown";
            if (meta.workspace_id) {
                 const { data: ws } = await supabase
                    .from("businesses")
                    .select("name")
                    .eq("id", meta.workspace_id)
                    .single();
                 if (ws) {
                     workspaceName = ws.name;
                 }
            }
            
            // Retrieve participants for this room
            let participants: import('livekit-server-sdk').ParticipantInfo[] = [];
            try {
                participants = await roomService.listParticipants(room.name);
            } catch(e) {
                console.error(`Failed to get participants for ${room.name}`);
            }

            return {
                id: room.sid,
                name: room.name,
                creationTime: creationTimeMs,
                durationMs,
                metadata: meta,
                workspaceName,
                participants: participants.map(p => ({
                    identity: p.identity,
                    state: p.state,
                    joinedAt: p.joinedAt ? Number(p.joinedAt) * 1000 : null,
                }))
            };
        }));
        
        // Sort by duration descending (longest running first)
        enrichedRooms.sort((a, b) => b.durationMs - a.durationMs);

        return NextResponse.json({ rooms: enrichedRooms });

    } catch (error: any) {
        console.error("Error listing rooms:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}
