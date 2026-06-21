import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { roomService } from '@/lib/server-utils';

export async function DELETE(request: Request, context: any) {
    try {
        const { roomName } = context.params;
        
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

        // Delete the room
        await roomService.deleteRoom(roomName);

        // Fetch room metadata if available, to log it
        let roomInfo = null;
        try {
            const rooms = await roomService.listRooms([roomName]);
            if (rooms && rooms.length > 0) {
                roomInfo = rooms[0];
            }
        } catch (e) {
            // Ignored, maybe already deleted
        }

        // Use service role client to insert audit log to bypass RLS
        // Or if the policy allows insertion, we could use the normal client.
        // Let's use the normal client assuming we update the policy or it's service role server side.
        // Wait, standard `createClient` doesn't have service role, so we'd need to create one, or just use it if we allow super_admin to insert.
        // Let's create an adminClient or just use regular client if RLS is bypassed or disabled for insert.
        // By default, if there is no INSERT policy, insert is blocked when RLS is enabled.
        // So we will need the service role.
        
        const { createClient: createSupabaseClient } = await import('@supabase/supabase-js');
        const supabaseAdmin = createSupabaseClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        try {
            const { error: auditError } = await supabaseAdmin.from("admin_audit_log").insert({
                action: 'kill_room',
                actor_id: user.id,
                target: roomName,
                metadata: {
                   room_name: roomName,
                   timestamp: new Date().toISOString()
                }
            });
            if (auditError) console.error("Audit logging failed:", auditError);
        } catch (auditException) {
            console.error("Audit logging exception:", auditException);
        }

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error("Error deleting room:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}
