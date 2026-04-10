const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  "https://dirqlpmlgorxxqqzqvls.supabase.co",
  process.env.SUPABASE_SERVICE_ROLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpcnFscG1sZ29yeHhxcXpxdmxzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDM3OTg5NywiZXhwIjoyMDg5OTU1ODk3fQ.zf-Dnk6tguP-8nJrADDFfufR9BCMPVRowBGCAO_rNzY"
);

async function checkRows() {
  const { data, error } = await supabase.from('prescription').select('*').limit(1);
  console.log("Prescription data shape/columns:", data, error);
}

checkRows();
