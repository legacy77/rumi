create policy "user baca membershipnya" on memberships for select using (user_id = auth.uid());
