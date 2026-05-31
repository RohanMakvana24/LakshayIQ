import { useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export function usePushNotifications(
  onNewMessage?: (senderId: string, content: string, senderName?: string) => void
) {
  const { user } = useAuth();
  const callbackRef = useRef(onNewMessage);
  callbackRef.current = onNewMessage;

  const requestPermission = useCallback(async () => {
    if (!("Notification" in window)) return "denied" as NotificationPermission;
    if (Notification.permission === "granted") {
      return "granted" as NotificationPermission;
    }
    if (Notification.permission !== "denied") {
      const perm = await Notification.requestPermission();
      return perm;
    }
    return Notification.permission;
  }, []);

  const showNotification = useCallback(
    (title: string, body: string, onClick?: () => void) => {
      if (!("Notification" in window) || Notification.permission !== "granted") return;
      try {
        const n = new Notification(title, {
          body,
          icon: "/favicon.ico",
          badge: "/favicon.ico",
          tag: "chat-message",
          requireInteraction: false,
        });
        if (onClick) n.onclick = () => { onClick(); n.close(); };
      } catch { /* ignore */ }
    },
    []
  );

  useEffect(() => {
    if (!user?.id) return;

    requestPermission();

    const userId = user.id;
    // Use a unique random suffix so each subscription mounts a fresh channel instance,
    // avoiding the "cannot add callbacks after subscribe" cached channel conflict
    const uniqueId = Math.random().toString(36).substring(2, 11);

    const channel = supabase
      .channel(`push-notif-${userId}-${uniqueId}`)
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

          // Dispatch callback
          callbackRef.current?.(msg.sender_id, msg.content, senderName);

          // Browser native push notification
          if (typeof Notification !== "undefined" && Notification.permission === "granted") {
            try {
              // Try standard desktop Notification constructor first (bypasses stale localhost service workers)
              new Notification(`💬 ${senderName}`, {
                body: msg.content.length > 80 ? msg.content.slice(0, 77) + "..." : msg.content,
                icon: "/favicon.ico",
                tag: "chat-message",
              });
            } catch (err) {
              // Fallback for mobile devices (like Chrome on Android) that block direct constructors
              try {
                if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
                  const reg = await navigator.serviceWorker.ready;
                  reg.showNotification(`💬 ${senderName}`, {
                    body: msg.content.length > 80 ? msg.content.slice(0, 77) + "..." : msg.content,
                    icon: "/favicon.ico",
                    badge: "/favicon.ico",
                    tag: "chat-message",
                  });
                }
              } catch { /* ignore */ }
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, requestPermission]);

  return { requestPermission, showNotification };
}
