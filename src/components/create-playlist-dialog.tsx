import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { createPlaylist } from "@/lib/library.functions";

export function CreatePlaylistDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCreated?: (id: string) => void;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const queryClient = useQueryClient();
  const doCreate = useServerFn(createPlaylist);

  const mut = useMutation({
    mutationFn: () => doCreate({ data: { name, description, is_public: isPublic } }),
    onSuccess: (row) => {
      queryClient.invalidateQueries({ queryKey: ["library"] });
      toast.success(`Playlist "${row.name}" created`);
      setName("");
      setDescription("");
      setIsPublic(false);
      onOpenChange(false);
      onCreated?.(row.id);
    },
    onError: (e: Error) => toast.error(e.message || "Couldn't create playlist"),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md border-border bg-surface">
        <DialogHeader>
          <DialogTitle>New playlist</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <label htmlFor="pl-name" className="mb-1 block text-xs font-semibold text-muted-foreground">
              Name
            </label>
            <input
              id="pl-name"
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={60}
              placeholder="My awesome mix"
              className="w-full rounded-lg bg-surface-2 px-3 py-2 text-sm outline-none ring-1 ring-border focus:ring-primary"
            />
          </div>
          <div>
            <label htmlFor="pl-desc" className="mb-1 block text-xs font-semibold text-muted-foreground">
              Description <span className="text-muted-foreground/60">(optional)</span>
            </label>
            <textarea
              id="pl-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={240}
              rows={2}
              className="w-full rounded-lg bg-surface-2 px-3 py-2 text-sm outline-none ring-1 ring-border focus:ring-primary"
            />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
              className="h-4 w-4 accent-[hsl(var(--primary))]"
            />
            Make this playlist public
          </label>
          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => onOpenChange(false)}
              className="rounded-full px-4 py-2 text-sm font-semibold text-muted-foreground hover:bg-white/5"
            >
              Cancel
            </button>
            <button
              onClick={() => mut.mutate()}
              disabled={!name.trim() || mut.isPending}
              className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-bold text-primary-foreground shadow-glow transition hover:brightness-110 disabled:opacity-50"
            >
              {mut.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Create
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
