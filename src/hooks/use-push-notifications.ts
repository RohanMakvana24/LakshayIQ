import { useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

let notificationPermission: NotificationPermission = "default";

// Global singleton: one shared channel per user ID.
// Maps userId -> { channel, refCount, callbacks: Set }
const channelRegistry = new Map<
  string,
  {
    channel: ReturnType<typeof supabase.channel>;
    refCount: number;
    callbacks: Set<(senderId: string, content: string, senderName?: string) => void>;
  }
>();

export function usePushNotifications(
  onNewMessage?: (senderId: string, content: string, senderName?: string) => void
) {
  const { user } = useAuth();
  // Keep a stable ref to the latest callback so we never re-subscribe on callback change
  const callbackRef = useRef(onNewMessage);
  callbackRef.current = onNewMessage;

  const requestPermission = useCallback(async () => {
    if (!("Notification" in window)) return "denied" as NotificationPermission;
    if (Notification.permission === "granted") {
      notificationPermission = "granted";
      return "granted" as NotificationPermission;
    }
    if (Notification.permission !== "denied") {
      const perm = await Notification.requestPermission();
      notificationPermission = perm;
      return perm;
    }
    return Notification.permission;
  }, []);

  const showNotification = useCallback(
    (title: string, body: string, onClick?: () => void) => {
      if (notificationPermission !== "granted") return;
      if (!("Notification" in window)) return;
      try {
        const n = new Notification(title, {
          body,
          icon: "/favicon.ico",
          badge: "/favicon.ico",
          tag: "chat-message",
          requireInteraction: false,
        });
        if (onClick) n.onclick = () => { onClick(); n.close(); };
      } catch {
        // Browser may block notifications in some contexts
      }
    },
    []
  );

  useEffect(() => {
    if (!user?.id) return;

    // Request notification permission on first mount
    requestPermission();

    const userId = user.id;

    // ------------------------------------------------------------------
    // Singleton channel pattern:
    // If a channel for this user already exists in the registry, just
    // register our callback into its Set. Otherwise, create one fresh.
    // ------------------------------------------------------------------
    if (!channelRegistry.has(userId)) {
      // Create the callback set first so the channel handler can dispatch to it
      const callbacks = new Set<
        (senderId: string, content: string, senderName?: string) => void
      >();

      const channel = supabase
        .channel(`push-notif-${userId}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "chat_messages",
            filter: `receiver_id=eq.${userId}`,
          },
          async (payload) => {
            const msg = payload.new as { sender_id: string; content: string; id: string };

            // Fetch sender name
            let senderName = "New Message";
            try {
              const { data } = await supabase
                .from("profiles")
                .select("full_name")
                .eq("id", msg.sender_id)
                .maybeSingle();
              if (data?.full_name) senderName = data.full_name;
            } catch { /* ignore */ }

            // Dispatch to ALL registered callbacks
            callbacks.forEach((cb) => cb(msg.sender_id, msg.content, senderName));

            // Browser push notification
            if (notificationPermission === "granted" && "Notification" in window) {
              try {
                new Notification(`💬 ${senderName}`, {
                  body:
                    msg.content.length > 80
                      ? msg.content.slice(0, 77) + "..."
                      : msg.content,
                  icon: "/favicon.ico",
                  tag: "chat-message",
                });
              } catch { /* ignore */ }
            }
          }
        )
        .subscribe();

      channelRegistry.set(userId, { channel, refCount: 0, callbacks });
    }

    const entry = channelRegistry.get(userId)!;
    entry.refCount += 1;

    // Register this instance's callback
    const stableCallback = (
      senderId: string,
      content: string,
      senderName?: string
    ) => callbackRef.current?.(senderId, content, senderName);

    if (onNewMessage !== undefined) {
      entry.callbacks.add(stableCallback);
    }

    return () => {
      const e = channelRegistry.get(userId);
      if (!e) return;

      // Unregister our callback
      if (onNewMessage !== undefined) {
        e.callbacks.delete(stableCallback);
      }

      e.refCount -= 1;

      // Tear down channel only when no components reference it anymore
      if (e.refCount <= 0) {
        supabase.removeChannel(e.channel);
        channelRegistry.delete(userId);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  return { requestPermission, showNotification };
}
