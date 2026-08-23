-- Private storage bucket for lead documents.
-- Path convention: {agent_id}/{lead_id}/{document_id}-{filename}
-- No delete policy: documents are an append-only audit trail — a rejected
-- status supersedes rather than deleting the object.

insert into storage.buckets (id, name, public)
values ('lead-documents', 'lead-documents', false)
on conflict (id) do nothing;

create policy "lead_documents_select_own_or_ops" on storage.objects for select
  using (
    bucket_id = 'lead-documents'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or public.is_ops_admin()
    )
  );

create policy "lead_documents_insert_own_or_ops" on storage.objects for insert
  with check (
    bucket_id = 'lead-documents'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or public.is_ops_admin()
    )
  );

create policy "lead_documents_update_own_or_ops" on storage.objects for update
  using (
    bucket_id = 'lead-documents'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or public.is_ops_admin()
    )
  );
