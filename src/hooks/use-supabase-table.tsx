import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function useSupabaseTable<T extends { id: string }>(
  table: string,
  options?: { orderBy?: string; ascending?: boolean }
) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const q = supabase.from(table as never).select("*");
    const { data, error } = await (options?.orderBy
      ? q.order(options.orderBy, { ascending: options.ascending ?? false })
      : q.order("created_at", { ascending: false }));
    if (error) toast.error(error.message);
    else setData((data ?? []) as T[]);
    setLoading(false);
  }, [table, options?.orderBy, options?.ascending]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const remove = async (id: string) => {
    if (!confirm("Delete this record?")) return;
    const { error } = await supabase.from(table as never).delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Deleted");
    fetchAll();
  };

  const insert = async (values: Record<string, unknown>) => {
    const { error } = await supabase.from(table as never).insert(values as never);
    if (error) { toast.error(error.message); return false; }
    toast.success("Saved");
    fetchAll();
    return true;
  };

  const update = async (id: string, values: Record<string, unknown>) => {
    const { error } = await supabase.from(table as never).update(values as never).eq("id", id);
    if (error) { toast.error(error.message); return false; }
    toast.success("Updated");
    fetchAll();
    return true;
  };

  return { data, loading, refresh: fetchAll, remove, insert, update };
}

export const uploadFile = async (bucket: string, path: string, file: File) => {
  const { data, error } = await supabase.storage.from(bucket).upload(path, file, {
    upsert: true,
  });
  if (error) {
    toast.error(`Upload failed: ${error.message}`);
    return null;
  }
  const { data: publicUrlData } = supabase.storage.from(bucket).getPublicUrl(path);
  return publicUrlData.publicUrl;
};

export const slugify = (s: string) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
