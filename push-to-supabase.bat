@echo off
echo Pushing changes to Supabase...

REM Push database schema changes
echo Pushing database schema...
npx supabase db push

REM Seed demo data
echo Seeding demo data...
npx supabase db seed

REM Reset database (optional - uncomment if needed)
REM echo Resetting database...
REM npx supabase db reset

echo Done! Check your Supabase dashboard.
pause
